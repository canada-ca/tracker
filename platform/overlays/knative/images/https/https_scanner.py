import os
import sys
import requests
import logging
import json
from pshtt import cli
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    'Content-Type': 'application/json',
    'Host': 'result-processor.tracker.example.com',
}

app = Flask(__name__)


@app.route('/dispatch', methods=['GET', 'POST'])
def dispatch():

    logging.info("Event received\n")

    try:
        scan_id = request.json['scan_id']
        domain = request.json['domain']
        res = scan(scan_id, domain)
        if res is not None:
            payload = json.dumps({"results": str(res), "scan_type": "https"})
            logging.info(str(res)+'\n')
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting pshtt scan" % scan_id)
        try:
            response = requests.post('http://34.67.57.19/dispatch', headers=headers, data=payload)
            logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
            logging.info(str(response.text))
            return str(response.text)
        except Exception as e:
            logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))
    except Exception as e:
        logging.error(str(e)+'\n')

def scan(scan_id, domain):
    try:
        res_dict = cli.run([domain])
        return res_dict
    except Exception as e:
        logging.error("(SCAN: %s) - %s", (scan_id, str(e)))
        return None


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

