import os
import sys
import requests
import logging
import json
import dkim
import base64
import emoji
from dkim import dnsplug, crypto
from dkim.crypto import *
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


def scan_dkim(domain):

    record = {}

    try:
        # Retrieve public key from DNS
        pk_txt = dnsplug.get_txt_dnspython(domain)

        pk, keysize, ktag = load_pk(domain, pk_txt)

        # Parse values and convert to dictionary
        pub = dkim.util.parse_tag_value(pk_txt)
        key_val = pub[b"p"].decode("ascii")

        record["t_value"] = None

        for key in pub:
            if key.decode("ascii") == "t":
                record["t_value"] = pub[key]

        txt_record = {}

        for key, val in pub.items():
            txt_record[key.decode("ascii")] = val.decode("ascii")

        record["txt_record"] = txt_record
        record["public_key_value"] = key_val
        record["key_size"] = keysize
        record["key_type"] = ktag.decode("ascii")
        record["public_key_modulus"] = pk["modulus"]
        record["public_exponent"] = pk["publicExponent"]

    except Exception as e:
        logging.error(
            "Failed to perform DomainKeys Identified Mail scan on given domain: %s"
            % str(e)
        )
        return None

    return json.dumps(record)


def Server(default_client=requests):

    async def scan(request):
        try:
            client = request.app.state.client

            logging.info("Scan request received")
            inbound_payload = await request.json()
            domain = inbound_payload["domain"]
            scan_id = inbound_payload["scan_id"]

            logging.info("Performing scan...")
            scan_results = scan_dkim(domain)

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "dkim", "scan_id": scan_id}
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("DKIM scan not completed")
            dispatch_results(outbound_payload, client)
        except Exception as e:
            return PlainTextResponse(f"An error occurred while attempting to process DKIM scan request: {str(e)}")

        return PlainTextResponse("DKIM scan completed. Scan results dispatched to result-processor")

    routes = [
        Route("/scan", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server()
