import os
import sys
import requests
import logging
import json
import threading
import jwt
from pshtt import cli
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {
    "Content-Type": "application/json",
    "Host": "result-processor.tracker.example.com"
}

app = Flask(__name__)

ISTIO_INGRESS = os.getenv("ISTIO_INGRESS")
TOKEN_KEY = os.getenv("TOKEN_KEY")

@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"),
            TOKEN_KEY,
            algorithm=['HS256']
        )

        test_flag = request.headers.get("Test")
        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]

        # Perform scan
        res = scan(scan_id, domain)

        # If this was a test scan, return results
        if test_flag:
            return str(res)

        # Construct request payload for result-processor
        if res is not None:
            payload = {"results": str(res)}
            token = {"scan_type": "https", "scan_id": scan_id}
            logging.info(str(res)+'\n')
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting pshtt scan" % scan_id)

        headers["Token"] = jwt.encode(
            token,
            TOKEN_KEY,
            algorithm='HS256'
        ).decode('utf-8')

        # Dispatch results to result-processor asynchronously
        th = threading.Thread(target=dispatch, args=[scan_id, payload])
        th.start()

        return 'Scan sent to result-handling service'

    except Exception as e:
        logging.error(str(e)+'\n')
        return 'Failed to send scan to result-handling service'


def dispatch(scan_id, payload):
    try:
        # Post request to result-handling service
        response = requests.post(ISTIO_INGRESS, headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))


def scan(scan_id, domain):
    try:

        # Run local implementation of "pshtt" https-scanning module
        res_dict = cli.run([domain])[1:-1]
        return res_dict
    except Exception as e:
        logging.error("(SCAN: %s) - %s", (scan_id, str(e)))
        return None


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
