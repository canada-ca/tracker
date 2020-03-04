import os
import sys
import requests
import logging
import json
import dkim
from dkim import dnsplug
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


def scan(scan_id, domain):

    record = {}

    try:
        # Retrieve public key from DNS
        pk_txt = dnsplug.get_txt_dnspython(domain)
        if type(pk_txt) is str:
            pub = dkim.util.parse_tag_value(pk_txt)
            verified_by = list(pub.keys())[0].decode('ascii')
            key_val = list(pub.keys())[0].decode('ascii')
        else:
            pub = dkim.util.parse_tag_value(pk_txt)
            verified_by = list(pub.keys())[0].decode('ascii')
            key_val = list(pub.keys())[0].decode('ascii')

        record["public_key"] = pub
        record["verified_by"] = verified_by
        record["public_key_value"] = key_val

        try:
            record["record"] = str(pk[0]["modulus"])
        except KeyError:
            pass
        try:
            record["key_length"] = pk[1]
        except KeyError:
            pass
        try:
            record["key_type"] = pk[2].decode('UTF-8')
        except KeyError:
            pass

    except Exception as e:
        logging.error("(SCAN: %s) - Failed to perform DomainKeys Identified Mail scan on given domain: %s" % (scan_id, e))
        return None

    return record

if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

