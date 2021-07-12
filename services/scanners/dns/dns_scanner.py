import sys
import os
import time
import requests
import logging
import json
import emoji
import dkim
import asyncio
import nacl
import base64
import tldextract
import traceback
import datetime as dt
from checkdmarc import *
from dns import resolver
from dkim import dnsplug, crypto, KeyFormatError
from dkim.util import InvalidTagValueList
from multiprocessing import Process, Queue
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
TIMEOUT = 80  # 80 second scan timeout
RES_QUEUE = Queue()

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)
OTS_QUEUE_URL = os.getenv(
    "OTS_RESULT_QUEUE_URL", "http://ots-result-queue.scanners.svc.cluster.local"
)
DEST_URL = lambda ots : OTS_QUEUE_URL if ots else QUEUE_URL


class ScanTimeoutException(BaseException):
    pass


def dispatch_results(payload, client, ots):
    client.post(DEST_URL(ots) + "/dns", json=json.dumps(payload))
    logging.info("Scan results dispatched to result queue")


def scan_dmarc(domain):
    logging.info("Initiating DMARC scan")

    # Single-item list to pass off to check_domains function.
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain.
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(f"Failed to check the given domains for DMARC/SPF records. ({e})")
        RES_QUEUE.put({})
        return

    if scan_result["dmarc"].get("record", "null") == "null":
        logging.info("DMARC scan completed")
        return {"dmarc": {"error": "missing"}}

    for rua in scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []):
        try:
            # Retrieve 'rua' tag address.
            rua_addr = rua["address"]

            # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
            rua_domain = rua_addr.split("@", 1)[1]

            # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
            extract = tldextract.TLDExtract(include_psl_private_domains=True)
            extract.update()
            parsed_domain = extract(domain)
            org_domain = ".".join([parsed_domain.domain, parsed_domain.suffix])

            # Extract organizational domain from 'rua' domain
            parsed_rua_domain = extract(rua_domain)
            rua_org_domain = ".".join([parsed_rua_domain.domain, parsed_rua_domain.suffix])

            # If the report destination's organizational does not differ from the provided domain's organizational domain, assert reports are being accepted.
            if rua_org_domain == org_domain:
                rua["accepting"] = True
            else:
                try:
                    # Request txt record to ensure that "rua" domain accepts DMARC reports.
                    rua_scan_result = resolver.query(
                        f"{domain}._report._dmarc.{rua_domain}", "TXT"
                    )
                    rua_txt_value = (
                        rua_scan_result.response.answer[0][0].strings[0].decode("UTF-8")
                    )
                    # Assert external reporting arrangement has been authorized if TXT containing version tag with value "DMARC1" is found.
                    scan_result["dmarc"]["tags"]["rua"]["accepting"] = (
                        rua_txt_value == "v=DMARC1"
                    )
                    logging.info("External reporting arrangement verified.")
                except (DNSException, SPFError, DMARCError, resolver.NXDOMAIN) as e:
                    logging.error(f"Failed to validate external reporting arrangement between rua address={rua_domain} and domain={domain}: {e}")
                    rua["accepting"] = "undetermined"
        except (TypeError, KeyError) as e:
            logging.error(f"Error occurred while attempting to validate rua address for domain={domain}: {e}")

    for ruf in scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []):
        try:
            # Retrieve 'ruf' tag address.
            ruf_addr = ruf["address"]

            # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
            ruf_domain = ruf_addr.split("@", 1)[1]

            # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
            extract = tldextract.TLDExtract(include_psl_private_domains=True)
            extract.update()
            parsed_domain = extract(domain)
            org_domain = ".".join([parsed_domain.domain, parsed_domain.suffix])

            # Extract organizational domain from 'ruf' domain
            parsed_ruf_domain = extract(ruf_domain)
            ruf_org_domain = ".".join([parsed_ruf_domain.domain, parsed_ruf_domain.suffix])

            # If the report destination's organizational does not differ from the provided domain's organizational domain, assert reports are being accepted.
            if ruf_org_domain == org_domain:
                ruf["accepting"] = True
            else:
                try:
                    # Request txt record to ensure that "ruf" domain accepts DMARC reports.
                    ruf_scan_result = resolver.query(
                        f"{domain}._report._dmarc.{ruf_domain}", "TXT"
                    )
                    ruf_txt_value = (
                        ruf_scan_result.response.answer[0][0].strings[0].decode("UTF-8")
                    )
                    # Assert external reporting arrangement has been authorized if TXT containing version tag with value "DMARC1" is found.
                    scan_result["dmarc"]["tags"]["ruf"]["accepting"] = (
                        ruf_txt_value == "v=DMARC1"
                    )
                    logging.info("External reporting arrangement verified.")
                except (DNSException, SPFError, DMARCError, resolver.NXDOMAIN) as e:
                    logging.error(f"Failed to validate external reporting arrangement between ruf address={ruf_domain} and domain={domain}: {e}")
                    ruf["accepting"] = "undetermined"
        except (TypeError, KeyError) as e:
            logging.error(f"Error occurred while attempting to validate ruf address for domain={domain}: {e}")

    logging.info("DMARC scan completed")

    RES_QUEUE.put(scan_result)


def bitsize(x):
    """Return size of long in bits."""
    return len(bin(x)) - 2


def load_pk(name, s=None):
    """
    Load the corresponding public key from DNS records
    :param name: Domain name
    :param s: TXT record from DNS
    :return: tuple (pk, keysize, ktag)
        WHERE
        pk: public key value
        keysize: size of public key
        ktag: key type (RSA, etc.)
    """
    if not s:
        raise KeyFormatError("missing public key: %s" % name)
    try:
        if type(s) is str:
            s = s.encode("ascii")
        pub = dkim.util.parse_tag_value(s)
    except InvalidTagValueList as e:
        raise KeyFormatError(e)
    try:
        if pub[b"k"] == b"ed25519":
            pk = nacl.signing.VerifyKey(pub[b"p"], encoder=nacl.encoding.Base64Encoder)
            keysize = 256
            ktag = b"ed25519"
    except KeyError:
        pub[b"k"] = b"rsa"
    if pub[b"k"] == b"rsa":
        try:
            pk = crypto.parse_public_key(base64.b64decode(pub[b"p"]))
            keysize = bitsize(pk["modulus"])
        except KeyError:
            raise KeyFormatError(f"incomplete public key: {s}")
        except (TypeError, UnparsableKeyError) as e:
            raise KeyFormatError(f"could not parse public key ({pub[b'p']}): {e}")
        ktag = b"rsa"
    return pk, keysize, ktag


def scan_dkim(domain, selectors):

    logging.info("Initiating DKIM scan")

    record = {}

    for selector in selectors:
        record[selector] = {}
        try:
            # Retrieve public key from DNS
            pk_txt = dnsplug.get_txt_dnspython(f"{selector}._domainkey.{domain}")
            logging.info("Public key (TXT) retrieved from DNS")

            pk, keysize, ktag = load_pk(f"{selector}._domainkey.{domain}", pk_txt)

            # Parse values and convert to dictionary
            pub = dkim.util.parse_tag_value(pk_txt)
            logging.info("DKIM tag values parsed")

            txt_record = {}

            key_val = pub[b"p"].decode("ascii")

            for key in pub:
                if key.decode("ascii") == "t":
                    record[selector]["t_value"] = pub[key]

            for key, val in pub.items():
                txt_record[key.decode("ascii")] = val.decode("ascii")

            record[selector]["txt_record"] = txt_record
            record[selector]["public_key_value"] = key_val
            record[selector]["key_size"] = keysize
            record[selector]["key_type"] = ktag.decode("ascii")
            record[selector]["public_key_modulus"] = pk["modulus"]
            record[selector]["public_exponent"] = pk["publicExponent"]

        except Exception as e:
            logging.error(
                f"Failed to perform DomainKeys Identified Mail scan on given domain: {domain}, (selector: {selector}): {str(e)}"
            )
            record[selector] = {"error": "missing"}

    logging.info("DKIM scan completed")

    RES_QUEUE.put(record)


def process_results(results):
    logging.info("Processing DNS scan results...")

    if results == {}:
        report = {
            "dmarc": {"error": "missing"},
            "spf": {"error": "missing"},
            "mx": {"error": "missing"},
            "dkim": {"error": "missing"},
        }
    else:
        report = {
            "dmarc": results["dmarc"],
            "spf": results["spf"],
            "mx": results["mx"],
            "dkim": results["dkim"],
        }

    logging.info(f"Processed DNS scan results: {str(report)}")
    return report


def Server(server_client=requests):


    def wait_timeout(proc, seconds):
        proc.start()
        start = time.time()
        end = start + seconds
        interval = min(seconds / 1000.0, .25)

        while True:
            result = proc.is_alive()
            if not result:
                proc.join()
                return
            if time.time() >= end:
                proc.terminate()
                proc.join()
                logging.error("Timeout while scanning")
                raise ScanTimeoutException("Scan timed out")
            time.sleep(interval)


    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        start_time = dt.datetime.now()
        try:
            domain = inbound_payload["domain"]
            user_key = inbound_payload["user_key"]
            selectors = inbound_payload.get("selectors", [])
            domain_key = inbound_payload["domain_key"]
            shared_id = inbound_payload["shared_id"]
        except KeyError:
            logging.error(f"Invalid scan request format received: {str(inbound_payload)}")
            return Response("Invalid Format", status_code=400)

        logging.info("Performing scan...")

        try:
            p = Process(target=scan_dmarc, args=(domain,))
            wait_timeout(p, TIMEOUT)
            scan_results = RES_QUEUE.get()
            if scan_results:
                if len(selectors) != 0:
                    p = Process(target=scan_dkim, args=(domain, selectors,))
                    wait_timeout(p, TIMEOUT)
                    scan_results["dkim"] = RES_QUEUE.get()
                else:
                    logging.info("No DKIM selector strings provided")
                    scan_results["dkim"] = {"error": "missing"}

        except ScanTimeoutException:
            return Response("Timeout occurred while scanning", status_code=500)

        processed_results = process_results(scan_results)

        outbound_payload = {
            "results": processed_results,
            "scan_type": "dns",
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id
        }
        logging.info(f"Scan results: {str(processed_results)}")

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client, (user_key is not None))

        logging.info(f"DNS scan completed in {elapsed_time.total_seconds()} seconds.")
        return Response("Scan completed")


    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))


    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route("/", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(
        debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown]
    )

    return starlette_app


app = Server()
