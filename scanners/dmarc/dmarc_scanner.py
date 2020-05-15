import os
import sys
import requests
import logging
import json
import emoji
import tldextract
from checkdmarc import *
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    print(emoji.emojize("ASGI server started... :rocket:"))


def initiate(request):

    logging.info("Scan received")

    received_payload = request.json()

    try:
        scan_id = received_payload["scan_id"]
        ext = tldextract.extract(received_payload["domain"])
        domain = ext.registered_domain

        # Perform scan
        response = requests.post('/scan', data={"domain": domain})

        scan_results = response.json()

        # Construct request payload for result-processor
        if scan_results is not None:
            payload = json.dumps({"results": scan_results, "scan_type": "dmarc", "scan_id": scan_id})
            logging.info(str(scan_results))
        else:
            raise Exception("DMARC scan not completed")

        # Dispatch results to result-processor
        requests.post('/dispatch', data=payload)

        return PlainTextResponse("DMARC scan completed. Results dispatched for processing")

    except Exception as e:
        logging.error(str(e))
        return PlainTextResponse("An error occurred while attempting to perform DMARC scan: %s" % str(e))


def dispatch_results(request, client):

    payload = request.json()

    headers = {
        "Content-Type": "application/json",
    }

    # Post request to result-handling service asynchronously
    task = BackgroundTask(client.post,
                          url="http://result-processor.tracker.svc.cluster.local",
                          headers=headers,
                          payload=payload)

    return PlainTextResponse("Scan results sent to result-processor", background=task)


def scan_dmarc(payload):

    domain = payload["domain"]
    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(
            "Failed to check the given domains for DMARC/SPF records: %s"
            % str(e)
        )
        return None

    if scan_result["dmarc"]["record"] is "null":
        return None
    else:
        return scan_result


def Server(functions={}, client=requests):

    def receive(request):
        return PlainTextResponse(initiate(request))

    def dispatch(request):
        return PlainTextResponse(functions["dispatch"](request.json()))

    def scan(request):
        return PlainTextResponse(functions["scan"](request.json(), client))

    routes = [
        Route('/dispatch', dispatch),
        Route('/scan', scan),
        Route('/receive', receive),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(functions={"dispatch": dispatch_results, "scan": scan_dmarc})
