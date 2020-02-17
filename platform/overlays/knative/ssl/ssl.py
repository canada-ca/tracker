import os
import requests
import subprocess
import json
from flask import Flask, request
from datetime import datetime

app = Flask(__name__)

@app.route('/enqueue', methods=['GET', 'POST'])
def enqueue():

    try:
        body = request.json
        domain = body['domain']
        scan_id = body['scan_id']
        res = {}
        res["results"] = scan(scan_id, domain)
        res["scan_type"] = "ssl"
        requests.post(url="http://ISTIO_INGRESS/enqueue", data=res,
                    headers={"Content-Type": "application/json", "Host": "result-processor.default.example.com"})

        return "Scan %s completed. Results queued for processing..." % scan_id
    except Exception as e:
        return str(e)

def scan(scan_id, domain):

    try:
        res_dict = {}

        # do stuff

        return res_dict

    except Exception as e:
        return str(e)


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding service.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
