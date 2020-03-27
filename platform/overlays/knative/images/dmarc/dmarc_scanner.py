import os
import sys
import requests
import logging
import json
import threading
import jwt
import tldextract
from checkdmarc import *
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    "Content-Type": "application/json",
    "Host": "result-processor.tracker.example.com"
}

app = Flask(__name__)


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        # TODO Replace secret
        decoded_payload = jwt.decode(
            request.get_data(),
            "test_jwt",
            algorithm=['HS256']
        )

        scan_id = decoded_payload["scan_id"]

        ext = tldextract.extract(decoded_payload["domain"])

        domain = ext.registered_domain

        res = scan(scan_id, domain)
        if res is not None:
            payload = {"results": str(res), "scan_type": "dmarc", "scan_id": scan_id}

        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to perform checkdmarc scan" % scan_id)

        # TODO Replace secret
        headers["Token"] = jwt.encode(
            "test_jwt",
            algorithm='HS256'
        ).decode('utf-8')

        th = threading.Thread(target=dispatch, args=[payload, scan_id])
        th.start()

        return 'Scan sent to result-handling service'

    except Exception as e:
        logging.error(str(e)+'\n')
        return 'Failed to send scan to result-handling service'


def dispatch(payload, scan_id):
    try:
        response = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))


def scan(scan_id, domain):

    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error("(SCAN: %s) - Failed to check the given domains for DMARC/SPF records: %s" % (scan_id, e))
        return None

    if scan_result["dmarc"]["record"] is "null":
        return None
    else:
        return scan_result

if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

