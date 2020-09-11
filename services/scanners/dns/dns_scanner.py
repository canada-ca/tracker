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
import traceback
import datetime as dt
from checkdmarc import *
from dkim import dnsplug, crypto, KeyFormatError
from dkim.crypto import *
from dkim.util import InvalidTagValueList
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

QUEUE_URL = "http://result-queue.scanners.svc.cluster.local/dns"


def dispatch_results(payload, client):
    client.post(QUEUE_URL, json=payload)
    logging.info("Scan results dispatched to result-processor")


async def scan_dmarc(domain):

    logging.info("Initiating DMARC scan")

    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(
            "Failed to check the given domains for DMARC/SPF records: %s" % str(e)
        )
        return None

    logging.info("DMARC scan completed")

    if scan_result["dmarc"].get("record", "null") == "null":
        return {"dmarc": {"missing": True}}
    else:
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
            raise KeyFormatError("incomplete public key: %s" % s)
        except (TypeError, UnparsableKeyError) as e:
            raise KeyFormatError("could not parse public key (%s): %s" % (pub[b"p"], e))
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

            pk, keysize, ktag = load_pk(f"{selector}.{domain}", pk_txt)

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
            dispatch_results(
                {"scan_type": "dns", "scan_id": scan_id, "results": {}}, server_client
            )
            return PlainTextResponse(msg)

        try:
            start_time = dt.datetime.now()
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(60)
            try:
                domain = inbound_payload["domain"]
                scan_id = inbound_payload["scan_id"]
                selectors = inbound_payload["selectors"]
            except KeyError:
                msg = f"Invalid scan request format received: {str(inbound_payload)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            logging.info(f"(ID={scan_id}) Performing scan...")
            dmarc_results = scan_dmarc(domain)

            try:
                iter(selectors)
                dkim_results = await scan_dkim(domain, selectors)
            except TypeError:
                logging.info("(ID={scan_id}) No DKIM selector strings provided")
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
                        "scan_id": scan_id,
                    }
                )
                logging.info(f"(ID={scan_id}) Scan results: {str(scan_results)}")
            else:
                raise Exception("DNS scan not completed")

        except Exception as e:
            signal.alarm(0)
            msg = f"(ID={scan_id}) An unexpected error occurred while attempting to process DNS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
            dispatch_results(
                {"scan_type": "dns", "scan_id": scan_id, "results": {}}, server_client
            )
            return PlainTextResponse(msg)

        signal.alarm(0)
        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client)
        msg = f"(ID={scan_id}) DNS scan completed in {elapsed_time.total_seconds()} seconds."
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
