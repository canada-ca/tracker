import os
import sys
import requests
import logging
import json
import jwt
import tldextract
from checkdmarc import *
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

destination = "http://result-processor.tracker.svc.cluster.local"

TOKEN_KEY = os.getenv("TOKEN_KEY")


def initiate(request):

    logging.info("Scan received")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        scan_id = decoded_payload["scan_id"]

        func_dict = {"Scanners": request.headers.get("Scanners"),
                     "Results": request.headers.get("Results")
                     }

        ext = tldextract.extract(decoded_payload["domain"])
        domain = ext.registered_domain

        # Perform scan
        res = scan(scan_id, domain)

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

        encoded_token = jwt.encode(token, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        # Dispatch results to result-processor
        msg = dispatch(scan_id, payload, func_dict, encoded_token)

        return PlainTextResponse("DMARC scan completed: %s", msg)

    except Exception as e:
        logging.error(str(e) + "\n")
        return "Failed to send scan to result-handling service"


def dispatch(scan_id, payload, func_dict, token):
    """
    Dispatch scan results to result-processor
    :param scan_id: ID of the scan object
    :param payload: Dict containing scan results, encrypted by JWT
    :return: Response from result-processor service
    """
    task = BackgroundTask()

    headers = {
        "Content-Type": "application/json",
        "Results": func_dict["Results"],
        "Token": token
    }

    target_func = globals()[func_dict["Scanners"]]

    try:
        # Post request to result-handling service asynchronously
        task.add_task(target_func, host=destination, headers=headers, payload=payload)
    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending scan results: %s\n"
            % (scan_id, e)
        )
        return PlainTextResponse("Error occurred while sending scan results: %s" % str(e))

    return PlainTextResponse("Scan results sent to result-processor", background=task)


async def send(host, payload, headers):
    requests.post(host + "/receive", headers=headers, data=payload)


async def mock_send(host, payload):
    return


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


def startup():
    print("ASGI server started...")


routes = [
    Route('/receive', initiate),
]

app = Starlette(debug=True, routes=routes, on_startup=[startup])
