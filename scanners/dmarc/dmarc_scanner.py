import os
import sys
import pybase64
import requests
import logging
import json
import threading
import jwt
import tldextract
from checkdmarc import *
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

headers = {"Content-Type": "application/json"}

destination = "http://result-processor.tracker.svc.cluster.local"

app = Flask(__name__)

TOKEN_KEY = pybase64.standard_b64decode(os.getenv("TOKEN_KEY"))


@app.route("/receive", methods=["GET", "POST"])
def receive():

    logging.info("Event received\n")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        test_flag = request.headers.get("Test")
        scan_id = decoded_payload["scan_id"]

        ext = tldextract.extract(decoded_payload["domain"])
        domain = ext.registered_domain

        # Perform scan
        res = scan(scan_id, domain)

        # If this was a test scan, return results
        if test_flag == "true":
            return str(res)

        # Construct request payload for result-processor
        if res is not None:
            payload = json.dumps({"results": str(res)})
            token = {"scan_type": "dmarc", "scan_id": scan_id}
            logging.info(str(res) + "\n")
        else:
            raise Exception(
                "(SCAN: %s) - An error occurred while attempting to perform checkdmarc scan"
                % scan_id
            )

        headers["Token"] = jwt.encode(token, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        # Dispatch results to result-processor asynchronously
        th = threading.Thread(target=dispatch, args=[scan_id, payload])
        th.start()

        return "Scan sent to result-handling service"

    except Exception as e:
        logging.error(str(e) + "\n")
        return "Failed to send scan to result-handling service"


def dispatch(scan_id, payload):
    """
    Dispatch scan results to result-processor
    :param scan_id: ID of the scan object
    :param payload: Dict containing scan results, encrypted by JWT
    :return: Response from result-processor service
    """
    try:
        # Post request to result-handling service
        response = requests.post(destination + "/receive", headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending scan results: %s\n"
            % (scan_id, e)
        )


def scan(scan_id, domain):
    """
    Scan domain to assess DMARC/SPF/MX records
    :param scan_id: ID of the scan object
    :param domain: Domain to be scanned
    :return: Scan results for provided domain
    """
    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(
            "(SCAN: %s) - Failed to check the given domains for DMARC/SPF records: %s"
            % (scan_id, e)
        )
        return None

    if scan_result["dmarc"]["record"] is "null":
        return None
    else:
        return scan_result


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
