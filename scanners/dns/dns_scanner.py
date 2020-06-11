import sys
import requests
import logging
import json
import emoji
import dkim
import nacl
import base64
from checkdmarc import *
from dkim import dnsplug, crypto, KeyFormatError
from dkim.crypto import *
from dkim.util import InvalidTagValueList
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/process", json=payload
    )


async def scan_dmarc(domain):

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

    if scan_result["dmarc"].get("record", "null") == "null":
        return None
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

    record = {}

    for selector in selectors:
        record[selector] = {}
        try:
            # Retrieve public key from DNS
            pk_txt = dnsplug.get_txt_dnspython(f"{selector}.{domain}")

            pk, keysize, ktag = load_pk(f"{selector}.{domain}", pk_txt)

            # Parse values and convert to dictionary
            pub = dkim.util.parse_tag_value(pk_txt)
            key_val = pub[b"p"].decode("ascii")

            record[selector]["t_value"] = None

            for key in pub:
                if key.decode("ascii") == "t":
                    record[selector]["t_value"] = pub[key]

            txt_record = {}

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
                "Failed to perform DomainKeys Identified Mail scan on given domain (selector: %s): %s"
                % (selector, str(e))
            )
            record[selector] = None

    return record


def Server(default_client=requests):
    async def scan(request):
        try:
            client = request.app.state.client

            logging.info("Scan request received")
            inbound_payload = await request.json()
            domain = inbound_payload["domain"]
            scan_id = inbound_payload["scan_id"]
            selectors = inbound_payload["selectors"]

            logging.info("Performing scan...")
            dmarc_results = scan_dmarc(domain)
            dkim_results = scan_dkim(domain, selectors)

            scan_results = await dmarc_results
            scan_results["dkim"] = await dkim_results

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "dns", "scan_id": scan_id}
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("DNS scan not completed")
            dispatch_results(outbound_payload, client)
        except Exception as e:
            return PlainTextResponse(
                f"An error occurred while attempting to process DNS scan request: {str(e)}"
            )

        return PlainTextResponse(
            "DNS scan completed. Scan results dispatched to result-processor"
        )

    routes = [
        Route("/scan", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server()
