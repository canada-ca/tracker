import os
import sys
import requests
import logging
import json
import dkim
import jwt
import base64
from dkim import dnsplug, crypto
from dkim.crypto import *
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

destination = "http://result-processor.tracker.svc.cluster.local"

TOKEN_KEY = os.getenv("TOKEN_KEY")


def initiate(request):

    logging.info("Scan received")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]

        func_dict = {"Scanners": request.headers.get("Scanner"),
                     "Results": request.headers.get("Results")
                     }

        # Perform scan
        res = scan(scan_id, domain)

        # Construct request payload for result-processor
        if res is not None:
            payload = json.dumps({"results": str(res)})
            token = {"scan_type": "dkim", "scan_id": scan_id}
            logging.info(str(res) + "\n")
        else:
            raise Exception(
                "(SCAN: %s) - An error occurred while attempting to perform dkim scan"
                % scan_id
            )

        encoded_token = jwt.encode(token, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        # Dispatch results to result-processor
        msg = dispatch(scan_id, payload, func_dict, encoded_token)

        return PlainTextResponse("DKIM scan completed: %s", msg)

    except Exception as e:
        logging.error(str(e) + "\n")
        return PlainTextResponse("Failed to send scan to result-handling service")


def dispatch(scan_id, payload, func_dict, token):
    """
    Dispatch scan results to result-processor
    :param scan_id: ID of the scan object
    :param payload: Dict containing scan results, encrypted by JWT
    :return: Response from result-processor service
    """
    task = BackgroundTask()

    headers = {
        "Content-Type": "application/json",
        "Results": func_dict["Results"],
        "Token": token
    }

    target_func = globals()[func_dict["Scanners"]]

    try:
        # Post request to result-handling service asynchronously
        task.add_task(target_func, host=destination, headers=headers, payload=payload)
    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending scan results: %s\n"
            % (scan_id, e)
        )
        return PlainTextResponse("Error occurred while sending scan results: %s" % str(e))

    return PlainTextResponse("Scan results sent to result-processor", background=task)


async def send(host, payload, headers):
    requests.post(host + "/receive", headers=headers, data=payload)


async def mock_send(host, payload):
    return


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


def scan(scan_id, domain):
    """
    Scan domain to assess DomainKeys Identified Mail (DKIM) record and key strength
    :param scan_id: ID of the scan object
    :param domain: Domain to be scanned
    :return: Scan results for provided domain
    """
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
            "(SCAN: %s) - Failed to perform DomainKeys Identified Mail scan on given domain: %s"
            % (scan_id, e)
        )
        return None

    return json.dumps(record)


def startup():
    print("ASGI server started...")


routes = [
    Route('/receive', initiate),
]

app = Starlette(debug=True, routes=routes, on_startup=[startup])
