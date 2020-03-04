import os
import sys
import requests
import logging
import json
from checkdmarc import *
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
            payload = json.dumps({"results": str(res), "scan_type": "dmarc", "scan_id": scan_id})

        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting to perform checkdmarc scan" % scan_id)

        dispatch(payload)

    except Exception as e:
        logging.error(str(e)+'\n')


def dispatch(payload):
    try:
        response = requests.post('http://34.67.57.19/dispatch', headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % payload["scan_id"])
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (payload["scan_id"], e))


def scan(scan_id, domain):

    try:
        scan_result = check_domains(domain)
    except (DNSException, SPFError, DMARCError) as e:
        logging.error("(SCAN: %s) - Failed to check the given domains for DMARC/SPF records: %s" % (scan_id, e))
        return None

    return scan_result

if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

