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
import signal
import tldextract
import traceback
import datetime as dt
from checkdmarc import *
from dns import resolver
from dkim import dnsplug, crypto, KeyFormatError
from dkim.crypto import *
from dkim.util import InvalidTagValueList
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)


def dispatch_results(payload, client):
    client.post(QUEUE_URL + "/dns", json=payload)
    logging.info("Scan results dispatched to result queue")


async def scan_dmarc(domain):

    logging.info("Initiating DMARC scan")

    # Single-item list to pass off to check_domains function.
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain.
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(f"Failed to check the given domains for DMARC/SPF records. ({e})")
        return None

    if scan_result["dmarc"].get("record", "null") == "null":
        logging.info("DMARC scan completed")
        return {"dmarc": {"missing": True}}

    for rua in scan_result["dmarc"]["tags"].get("rua", {}).get("value", []):
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
                logging.error(f"Failed to validate rua address {rua_domain}: {e}")
                rua["accepting"] = "undetermined"

    for ruf in scan_result["dmarc"]["tags"].get("ruf", {}).get("value", []):
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
                logging.error(f"Failed to validate ruf address {ruf_domain}: {e}")
                ruf["accepting"] = "undetermined"

    logging.info("DMARC scan completed")
    return scan_result


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
            pk = parse_public_key(base64.b64decode(pub[b"p"]))
            keysize = bitsize(pk["modulus"])
        except KeyError:
            raise KeyFormatError(f"incomplete public key: {s}")
        except (TypeError, UnparsableKeyError) as e:
            raise KeyFormatError(f"could not parse public key ({pub[b'p']}): {e}")
        ktag = b"rsa"
    return pk, keysize, ktag


async def scan_dkim(domain, selectors):

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
            record[selector] = {"missing": True}

    logging.info("DKIM scan completed")

    return record


def process_results(results):
    logging.info("Processing DNS scan results...")

    if results is not None and results != {}:
        report = {
            "dmarc": results["dmarc"],
            "spf": results["spf"],
            "mx": results["mx"],
            "dkim": results["dkim"],
        }
    else:
        report = {
            "dmarc": {"missing": True},
            "spf": {"missing": True},
            "mx": {"missing": True},
            "dkim": {"missing": True},
        }

    logging.info(f"Processed DNS scan results: {str(report)}")
    return report


def Server(server_client=requests):
    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        def timeout_handler(signum, frame):
            msg = "Timeout while performing scan"
            logging.error(msg)
            return PlainTextResponse(msg)

        try:
            start_time = dt.datetime.now()
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(60)
            try:
                domain = inbound_payload["domain"]
                uuid = inbound_payload["uuid"]
                selectors = inbound_payload.get("selectors", [])
                domain_key = inbound_payload["domain_key"]
            except KeyError:
                msg = f"Invalid scan request format received: {str(inbound_payload)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            logging.info("Performing scan...")
            dmarc_results = scan_dmarc(domain)

            try:
                iter(selectors)
                dkim_results = await scan_dkim(domain, selectors)
            except TypeError:
                logging.info("No DKIM selector strings provided")
                dkim_results = {}
                pass

            scan_results = await dmarc_results
            scan_results["dkim"] = dkim_results

            if scan_results["dmarc"] != {"missing": True}:

                processed_results = process_results(scan_results)

                outbound_payload = json.dumps(
                    {
                        "results": processed_results,
                        "scan_type": "dns",
                        "uuid": uuid,
                        "domain_key": domain_key,
                    }
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("DNS scan not completed")

        except Exception as e:
            signal.alarm(0)
            msg = f"An unexpected error occurred while attempting to process DNS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
            dispatch_results(
                {
                    "scan_type": "dns",
                    "uuid": uuid,
                    "domain_key": domain_key,
                    "results": {
                        "dmarc": {"missing": True},
                        "dkim": {"missing": True},
                        "spf": {"missing": True},
                    },
                },
                server_client,
            )
            return PlainTextResponse(msg)

        signal.alarm(0)
        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client)
        msg = f"DNS scan completed in {elapsed_time.total_seconds()} seconds."
        logging.info(msg)

        return PlainTextResponse(msg)

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
