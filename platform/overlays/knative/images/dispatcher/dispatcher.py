import os
import sys
import re
import subprocess
import json
import logging
import requests
import jwt
import threading
from flask import Flask, request
from datetime import datetime

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

hosts = ['https-scanner.tracker.example.com',
         'ssl-scanner.tracker.example.com',
         'dmarc-scanner.tracker.example.com']

dkim_flagged_hosts = ['dkim-scanner.tracker.example.com,'
                      'dmarc-scanner.tracker.example.com']

manual_scan_hosts = ['https-scanner-manual.tracker.example.com',
                     'ssl-scanner-manual.tracker.example.com',
                     'dmarc-scanner-manual.tracker.example.com']

manual_scan_dkim_flagged_hosts = ['dkim-scanner-manual.tracker.example.com,'
                                  'dmarc-scanner-manual.tracker.example.com']


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    payload = {}
    dkim_flag = False

    try:
        #TODO Replace secret
        decoded_payload = jwt.decode(
            request.headers.get('Data'),
            "test_jwt",
            algorithm=['HS256']
        )

        test_flag = request.headers.get("Test")

        payload = {"scan_id": decoded_payload["scan_id"], "domain": decoded_payload["domain"]}
        dkim_flag = decoded_payload["dkim"]
        user_initialized = decoded_payload["user_init"]
        scan_id = decoded_payload["scan_id"]

        # TODO Replace secret
        header_token = jwt.encode(
            "test_jwt",
            algorithm='HS256'
        ).decode('utf-8')

        if test_flag == "true":
            return dispatch(payload, dkim_flag, user_initialized, scan_id, header_token, test_flag)
        else:
            th = threading.Thread(target=dispatch,
                                  args=[payload, dkim_flag, user_initialized, scan_id, header_token, test_flag])
            th.start()

        return 'Domain dispatched to designated scanner(s)'

    except jwt.ExpiredSignatureError as e:
        logging.error('Failed (Expired Signature - 406): %s\n' % str(e))
        return 'Failed to dispatch domain to designated scanner(s)'

    except jwt.InvalidTokenError as e:
        logging.error('Failed (Invalid Token - 401): %s\n' % str(e))
        return 'Failed to dispatch domain to designated scanner(s)'

    except Exception as e:
        logging.error('Failed: %s\n' % str(e))
        return 'Failed to dispatch domain to designated scanner(s)'


def dispatch(payload, dkim_flag, manual, scan_id, header_token, test_flag):
    headers = {
        "Content-Type": "application/json",
        "Host": None,
        "Token": header_token,
        "Test": test_flag
    }

    dispatched = {}

    if not manual:

        if dkim_flag:
            for host in dkim_flagged_hosts:
                headers["Host"] = host
                try:
                    dispatched[scan_id] = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))
        else:
            for host in hosts:
                headers['Host'] = host
                try:
                    dispatched[scan_id] = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))

    else:

        if dkim_flag:
            for host in manual_scan_dkim_flagged_hosts:
                headers["Host"] = host
                try:
                    dispatched[scan_id] = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))
        else:
            for host in manual_scan_hosts:
                headers["Host"] = host
                try:
                    dispatched[scan_id] = requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (scan_id, e))

    if test_flag == "true":
        results = {}
        for key, req in dispatched:
            results[key] = str(req.text)

        return results


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
