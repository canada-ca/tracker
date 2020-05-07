import os
import sys
import logging
import requests
import jwt
import threading
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

TOKEN_KEY = os.getenv("TOKEN_KEY")


hosts = ['http://https-scanner.tracker.svc.cluster.local',
         'http://ssl-scanner.tracker.svc.cluster.local',
         'http://dmarc-scanner.tracker.svc.cluster.local']

dkim_flagged_hosts = ['http://dkim-scanner.tracker.svc.cluster.local',
                      'http://dmarc-scanner.tracker.svc.cluster.local']

manual_scan_hosts = ['http://https-scanner-manual.tracker.svc.cluster.local',
                     'http://ssl-scanner-manual.tracker.svc.cluster.local',
                     'http://dmarc-scanner-manual.tracker.svc.cluster.local']

manual_scan_dkim_flagged_hosts = ['http://dkim-scanner-manual.tracker.svc.cluster.local',
                                  'http://dmarc-scanner-manual.tracker.svc.cluster.local']


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    payload = {}
    dkim_flag = False

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        test_flag = request.headers.get("Test")

        payload = {
            "scan_id": decoded_payload["scan_id"],
            "domain": decoded_payload["domain"],
        }
        dkim_flag = decoded_payload["dkim"]
        user_initialized = decoded_payload["user_init"]
        scan_id = decoded_payload["scan_id"]

        encrypted_payload = jwt.encode(payload, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        if test_flag == "true":
            res = dispatch(
                encrypted_payload, dkim_flag, user_initialized, scan_id, test_flag
            )
            return str(res)
        else:
            th = threading.Thread(
                target=dispatch,
                args=[
                    encrypted_payload,
                    dkim_flag,
                    user_initialized,
                    scan_id,
                    test_flag,
                ],
            )
            th.start()

        return "Domain dispatched to designated scanner(s)"

    except jwt.ExpiredSignatureError as e:
        logging.error("Failed (Expired Signature - 406): %s\n" % str(e))
        return "Failed to dispatch domain to designated scanner(s)"

    except jwt.InvalidTokenError as e:
        logging.error("Failed (Invalid Token - 401): %s\n" % str(e))
        return "Failed to dispatch domain to designated scanner(s)"

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return "Failed to dispatch domain to designated scanner(s)"


def dispatch(encrypted_payload, dkim_flag, manual, scan_id, test_flag):
    """
    Dispatch scans to designated scanners
    :param encrypted_payload: Dict containing scan info, encrypted by JWT
    :param dkim_flag: Flag indicating whether this is a dkim scan
    :param manual: Flag indicating whether this is a user-initiated scan
    :param scan_id: ID of the scan object
    :param test_flag: Flag indicating whether this is a test scan
    :return: If test_flag, return results. Else, return nothing
    """

    headers = {
        "Content-Type": "application/json",
        "Data": encrypted_payload,
        "Test": test_flag,
    }

    dispatched = {scan_id: {}}

    if not manual:

        if dkim_flag is True:
            for host in dkim_flagged_hosts:
                try:
                    dispatched[scan_id][host] = requests.post(host, headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error(
                        "(SCAN: %s) - Error occurred while sending scan results: %s\n"
                        % (scan_id, e)
                    )
        else:
            for host in hosts:
                try:
                    dispatched[scan_id][host] = requests.post(host, headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error(
                        "(SCAN: %s) - Error occurred while sending scan results: %s\n"
                        % (scan_id, e)
                    )

    else:

        if dkim_flag is True:
            for host in manual_scan_dkim_flagged_hosts:
                try:
                    dispatched[scan_id][host] = requests.post(host, headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error(
                        "(SCAN: %s) - Error occurred while sending scan results: %s\n"
                        % (scan_id, e)
                    )
        else:
            for host in manual_scan_hosts:
                try:
                    dispatched[scan_id][host] = requests.post(host, headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
                except Exception as e:
                    logging.error(
                        "(SCAN: %s) - Error occurred while sending scan results: %s\n"
                        % (scan_id, e)
                    )

    if test_flag == "true":
        results = {}
        for key, req in dispatched[scan_id].items():
            results[key] = str(req.text)
            logging.info("Scan %s results for %s: %s\n" % (scan_id, key, req.text))

        return results


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
