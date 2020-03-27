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


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    logging.info("Event received\n")

    try:
        # TODO Replace secret
        decoded_payload = jwt.decode(
            request.headers.get("Token"),
            "test_jwt",
            algorithm=['HS256']
        )

        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]
        res = scan(scan_id, domain)
        if res is not None:
            payload = {"results": str(res), "scan_type": "https", "scan_id": scan_id}
            logging.info(str(res)+'\n')
        else:
            raise Exception("(SCAN: %s) - An error occurred while attempting pshtt scan" % scan_id)

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
    try:
        res_dict = cli.run([domain])[1:-1]
        return res_dict
    except Exception as e:
        logging.error("(SCAN: %s) - %s", (scan_id, str(e)))
        return None


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured as an ENV
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
