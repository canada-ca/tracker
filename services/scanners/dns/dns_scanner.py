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
from pebble import concurrent
from concurrent.futures import TimeoutError
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = os.getenv("SCAN_TIMEOUT", 80)

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)
OTS_QUEUE_URL = os.getenv(
    "OTS_RESULT_QUEUE_URL", "http://ots-result-queue.scanners.svc.cluster.local"
)
DEST_URL = lambda ots : OTS_QUEUE_URL if ots else QUEUE_URL


def dispatch_results(payload, client, ots):
    client.post(DEST_URL(ots) + "/dns", json=json.dumps(payload))
    logging.info("Scan results dispatched to result queue")


class DmarcScanner():
    domain = None


    def __init__(self, target_domain):
        self.domain = target_domain


    @concurrent.process(timeout=TIMEOUT)
    def run(self):
        logging.info("Initiating DMARC scan")

        # Single-item list to pass off to check_domains function.
        domain_list = list()
        domain_list.append(self.domain)

        try:
            # Perform "checkdmarc" scan on provided domain.
            scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
        except (DNSException, SPFError, DMARCError) as e:
            logging.error(f"Failed to check the given domains for DMARC/SPF records. ({e})")
            return {
                "dmarc": {"error": "missing"},
                "spf": {"error": "missing"},
                "mx": {"error": "missing"},
            }

        if scan_result["dmarc"].get("record", "null") == "null":
            logging.info("DMARC scan completed")
            return {
                "dmarc": {"error": "missing"},
                "spf": {"error": "missing"},
                "mx": {"error": "missing"},
            }

        for rua in scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []):
            try:
                # Retrieve 'rua' tag address.
                rua_addr = rua["address"]

                # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
                rua_domain = rua_addr.split("@", 1)[1]

                # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
                extract = tldextract.TLDExtract(include_psl_private_domains=True)
                extract.update()
                parsed_domain = extract(self.domain)
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
                            f"{self.domain}._report._dmarc.{rua_domain}", "TXT"
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
                        logging.error(f"Failed to validate external reporting arrangement between rua address={rua_domain} and domain={self.domain}: {e}")
                        rua["accepting"] = "undetermined"
            except (TypeError, KeyError) as e:
                logging.error(f"Error occurred while attempting to validate rua address for domain={self.domain}: {e}")

        for ruf in scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []):
            try:
                # Retrieve 'ruf' tag address.
                ruf_addr = ruf["address"]

                # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
                ruf_domain = ruf_addr.split("@", 1)[1]

                # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
                extract = tldextract.TLDExtract(include_psl_private_domains=True)
                extract.update()
                parsed_domain = extract(self.domain)
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
                            f"{self.domain}._report._dmarc.{ruf_domain}", "TXT"
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
                        logging.error(f"Failed to validate external reporting arrangement between ruf address={ruf_domain} and domain={self.domain}: {e}")
                        ruf["accepting"] = "undetermined"
            except (TypeError, KeyError) as e:
                logging.error(f"Error occurred while attempting to validate ruf address for domain={self.domain}: {e}")

        logging.info("DMARC scan completed")

        return scan_result


class DkimScanner():
    domain = None
    selectors = None


    def __init__(self, target_domain, target_selectors):
        self.domain = target_domain
        self.selectors = target_selectors


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


    @concurrent.process(timeout=TIMEOUT)
    def run(self):

        logging.info("Initiating DKIM scan")

        record = {}

        for selector in self.selectors:
            record[selector] = {}
            try:
                # Retrieve public key from DNS
                pk_txt = dnsplug.get_txt_dnspython(f"{selector}._domainkey.{self.domain}")
                logging.info("Public key (TXT) retrieved from DNS")

                pk, keysize, ktag = load_pk(f"{selector}._domainkey.{self.domain}", pk_txt)

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
                    f"Failed to perform DomainKeys Identified Mail scan on given domain: {self.domain}, (selector: {selector}): {str(e)}"
                )
                record[selector] = {"error": "missing"}

        logging.info("DKIM scan completed")

        return record


def Server(server_client=requests):


    def wait_timeout(proc, group, seconds):
        logging.info(f"Scan initiated for {proc.domain}...")
        proc.start()
        start = time.time()
        end = start + seconds
        interval = min(seconds / 1000.0, .25)

        while True:
            result = proc.is_alive()
            present = time.time()
            if not result:
                logging.info(f"Scan completed for {proc.domain}")
                proc.join()
                return
            if present >= end:
                proc.terminate()
                proc.join()
                logging.error(f"Timeout while scanning {proc.domain} (Aborted after {present-start} seconds)")
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

        try:
            scanner = DmarcScanner(domain)
            start = time.time()

            future = scanner.run()
            scan_results = future.result()

            if len(selectors) != 0:
                scanner = DkimScanner(domain, selectors)
                start = time.time()

                future = scanner.run()
                scan_results["dkim"] = future.result()
            else:
                logging.info("No DKIM selector strings provided")
                scan_results["dkim"] = {"error": "missing"}

        except TimeoutError:
            logging.error(f"Timeout while scanning {domain} (Aborted after {round(time.time()-start, 2)} seconds)")
            outbound_payload = json.dumps(
                {
                    "results": {
                        "dmarc": {"error": "missing"},
                        "spf": {"error": "missing"},
                        "mx": {"error": "missing"},
                        "dkim": {"error": "missing"},
                    },
                    "scan_type": "dns",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id
                }
            )
            dispatch_results(outbound_payload, server_client, (user_key is not None))
            return Response("Timeout occurred while scanning", status_code=500)

        outbound_payload = {
            "results": scan_results,
            "scan_type": "dns",
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id
        }
        logging.info(f"Scan results: {str(scan_results)}")

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
