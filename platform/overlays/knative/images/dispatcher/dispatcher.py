import os
import sys
import re
import subprocess
import json
import logging
import requests
import jwt
from flask import Flask, request
from datetime import datetime

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

scanner_hosts = ['https-scanner.tracker.example.com',
                 'ssl-scanner.tracker.example.com',
                 'dmarc-scanner.tracker.example.com']

dkim_host = 'dkim-scanner.tracker.example.com'


@app.errorhandler(jwt.InvalidTokenError)
def invalid_token():
    # 401 - Unauthorized
    return "Error: Invalid Token", 401


@app.errorhandler(jwt.ExpiredSignatureError)
def expired_signature():
    # 406 - Not Acceptable
    return "Error: Expired Signature", 406


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    payload = {}
    dkim_flag = False

    try:
        decoded_payload = jwt.decode(
            request.headers["Authorization"],
            os.getenv('SUPER_SECRET_SALT'),
            algorithm=['HS256']
        )

        for key, val in decoded_payload.items():
            if key is 'dkim':
                dkim_flag = val
            elif key is 'scan_id' or key is "domain":
                payload[key] = val

        dispatch(payload, dkim_flag)

    except jwt.ExpiredSignatureError as e:
        logging.error('Failed (ExpiredSignatureError): %s\n' % str(e))
    except jwt.InvalidTokenError as e:
        logging.error('Failed (InvalidTokenError): %s\n' % str(e))
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
