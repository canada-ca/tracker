import os
import sys
import requests
import logging
import json
import dkim
import threading
import jwt
import base64
from dkim import dnsplug, crypto
from dkim.crypto import *
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {"Content-Type": "application/json"}

destination = "http://result-processor.tracker.svc.cluster.local"

app = Flask(__name__)

TOKEN_KEY = os.getenv("TOKEN_KEY")


@app.route("/receive", methods=["GET", "POST"])
def receive():

    logging.info("Event received\n")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        test_flag = request.headers.get("Test")
        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]

        # Perform scan
        res = scan(scan_id, domain)

        # If this was a test scan, return results
        if test_flag == "true":
            return str(res)

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

        headers["Token"] = jwt.encode(token, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        # Dispatch results to result-processor asynchronously
        th = threading.Thread(target=dispatch, args=[scan_id, payload])
        th.start()

        return "Scan sent to result-handling service"

    except Exception as e:
        logging.error(str(e) + "\n")
        return "Failed to send scan to result-handling service"


def dispatch(scan_id, payload):
    """
    Dispatch scan results to result-processor
    :param scan_id: ID of the scan object
    :param payload: Dict containing scan results, encrypted by JWT
    :return: Response from result-processor service
    """
    try:
        # Post request to result-handling service
        response = requests.post(
            destination + "/receive", headers=headers, data=payload
        )
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending scan results: %s\n"
            % (scan_id, e)
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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
