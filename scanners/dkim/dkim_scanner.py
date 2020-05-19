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
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started... :rocket:"))


def initiate(request):

    logging.info("Scan received")

    received_payload = request.json()

    try:
        scan_id = received_payload["scan_id"]
        domain = received_payload["domain"]

        # Perform scan
        response = requests.post('/scan', data={"domain": domain})

        scan_results = response.json()

        # Construct request payload for result-processor
        if scan_results is not None:
            payload = json.dumps({"results": scan_results, "scan_type": "dkim", "scan_id": scan_id})
            logging.info(str(scan_results))
        else:
            raise Exception("DKIM scan not completed")

        # Dispatch results to result-processor
        requests.post('/dispatch', data=payload)

        return PlainTextResponse("DKIM scan completed. Results dispatched for processing")

    except Exception as e:
        logging.error(str(e))
        return PlainTextResponse("An error occurred while attempting to perform DKIM scan: %s" % str(e))


def dispatch_results(request, client):

    payload = request.json()

    headers = {
        "Content-Type": "application/json",
    }

    # Post request to result-handling service asynchronously
    task = BackgroundTask(client.post,
                          url="http://result-processor.tracker.svc.cluster.local",
                          headers=headers,
                          payload=payload)

    return PlainTextResponse("Scan results sent to result-processor", background=task)


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


def scan_dkim(payload):

    record = {}
    domain = payload["domain"]

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

    def receive(request):
        return PlainTextResponse(initiate(request))

    def dispatch(request):
        return PlainTextResponse(functions["dispatch"](request.json()))

    def scan(request):
        return PlainTextResponse(functions["scan"](request.json(), client))

    routes = [
        Route('/dispatch', dispatch),
        Route('/scan', scan),
        Route('/receive', receive),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(functions={"dispatch": dispatch_results, "scan": scan_dkim})
