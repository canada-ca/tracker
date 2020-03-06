import os
import sys
import requests
import logging
import json
import dkim
from dkim import dnsplug, crypto
from dkim.crypto import *
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    'Content-Type': 'application/json',
    'Host': 'result-processor.tracker.example.com',
}

app = Flask(__name__)


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        scan_id = request.json['scan_id']
        domain = request.json['domain']
        res = scan(scan_id, domain)
        if res is not None:
            payload = json.dumps({"results": str(res), "scan_type": "dkim", "scan_id": scan_id})

        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to perform dkim scan" % scan_id)

        dispatch(payload)

    except Exception as e:
        logging.error(str(e)+'\n')


def dispatch(payload):
    try:
        response = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % payload["scan_id"])
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (payload["scan_id"], e))


def bitsize(x):
    """Return size of long in bits."""
    return len(bin(x)) - 2


def load_pk(name, s=None):
    if not s:
        raise KeyFormatError("missing public key: %s"%name)
    try:
        if type(s) is str:
          s = s.encode('ascii')
        pub = dkim.util.parse_tag_value(s)
    except InvalidTagValueList as e:
        raise KeyFormatError(e)
    try:
        if pub[b'k'] == b'ed25519':
            pk = nacl.signing.VerifyKey(pub[b'p'], encoder=nacl.encoding.Base64Encoder)
            keysize = 256
            ktag = b'ed25519'
    except KeyError:
        pub[b'k'] = b'rsa'
    if pub[b'k'] == b'rsa':
        try:
            pk = parse_public_key(base64.b64decode(pub[b'p']))
            keysize = bitsize(pk['modulus'])
        except KeyError:
            raise KeyFormatError("incomplete public key: %s" % s)
        except (TypeError,UnparsableKeyError) as e:
            raise KeyFormatError("could not parse public key (%s): %s" % (pub[b'p'],e))
        ktag = b'rsa'
    return pk, keysize, ktag


def scan(scan_id, domain):

    record = {}

    try:
        # Retrieve public key from DNS
        pk_txt = dnsplug.get_txt_dnspython(domain)

        pk, keysize, ktag = load_pk(domain, pk_txt)

        # Parse values and convert to dictionary
        pub = dkim.util.parse_tag_value(pk_txt)
        key_val = pub[b'p'].decode('ascii')

        record["t_value"] = None

        for key in pub:
            if key.decode('ascii') is 't':
                record["t_value"] = pub[key]

        if keysize < 1024:
            record["p_sub1024"] = True
        elif keysize == 1024:
            record["p_1024"] = True

        record["txt_record"] = pub
        record["public_key_value"] = key_val
        record["key_size"] = keysize
        record["key_type"] = ktag.decode('ascii')
        record["modulus"] = pk["modulus"]
        record["public_exponent"] = pk["publicExponent"]

    except Exception as e:
        logging.error("(SCAN: %s) - Failed to perform DomainKeys Identified Mail scan on given domain: %s" % (scan_id, e))
        return None

    return record

if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

