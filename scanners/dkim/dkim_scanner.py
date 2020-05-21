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


def initiate(received_payload):

    logging.info("Scan received")

    try:
        scan_id = received_payload["scan_id"]
        domain = received_payload["domain"]

        # Perform scan
        scan_response = requests.post('http://127.0.0.1:8000/scan', data=domain)

        scan_results = scan_response.json()

        # Construct request payload for result-processor
        if scan_results is not None:
            payload = json.dumps({"results": scan_results, "scan_type": "dkim", "scan_id": scan_id})
            logging.info(str(scan_results))
        else:
            raise Exception("DKIM scan not completed")

        # Dispatch results to result-processor
        dispatch_response = requests.post('http://127.0.0.1:8000/dispatch', json=payload)

        return f'DKIM scan completed. {dispatch_response.text}'

    except Exception as e:
        logging.error(str(e))
        return "An error occurred while attempting to perform DKIM scan: %s" % str(e)


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(url="http://result-processor.tracker.svc.cluster.local/receive", json=payload)


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
            if key.decode("ascii") is "t":
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


def Server(functions={}, client=requests):

    async def receive(request):
        logging.info("Request received")
        payload = await request.json()
        return PlainTextResponse(initiate(payload))

    async def dispatch(request):
        try:
            payload = await request.json()
            functions["dispatch"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Scan results sent to result-processor")

    async def scan(request):
        domain = await request.body()
        logging.info("Performing scan...")
        return JSONResponse(functions["scan"](domain.decode("utf-8")))

    routes = [
        Route('/dispatch', dispatch, methods=['POST']),
        Route('/scan', scan, methods=['POST']),
        Route('/receive', receive, methods=['POST']),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(functions={"dispatch": dispatch_results, "scan": scan_dkim})
