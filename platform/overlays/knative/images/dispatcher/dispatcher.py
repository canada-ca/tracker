import os
import sys
import re
import subprocess
import json
import logging
import requests
from flask import Flask, request
from datetime import datetime

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

scanner_hosts = ['https-scanner.tracker.example.com',
                 'ssl-scanner.tracker.example.com',
                 'dmarc-scanner.tracker.example.com']

dkim_host = 'dkim-scanner.tracker.example.com'

@app.route('/receive', methods=['GET', 'POST'])
def receive():

    payload = {}
    dkim_flag = False

    try:
        for key, val in request.json:
            if key is 'dkim':
                dkim_flag = val
            else:
                payload[key] = val

        dispatch(payload, dkim_flag)

    except Exception as e:
        logging.error('Failed: %s\n' % str(e))


def dispatch(payload, dkim_flag):
    headers = {
        'Content-Type': 'application/json',
        'Host': None,
    }

    if dkim_flag:
        headers['Host'] = dkim_host
        requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
    else:
        for host in scanner_hosts:
            headers['Host'] = host
            try:
                requests.post('http://34.67.57.19/receive', headers=headers, data=payload)
                logging.info("Scan %s dispatched...\n" % payload["scan_id"])
            except Exception as e:
                logging.error("(SCAN: %s) - Error occurred while sending scan results: %s\n" % (payload["scan_id"], e))


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
