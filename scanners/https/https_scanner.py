import os
import sys
import requests
import logging
import json
import emoji
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started... :rocket:"))


def initiate(request):

    logging.info("Scan received")

    received_payload = request.json()

    try:
        scan_id = received_payload["scan_id"]
        domain = received_payload["domain"]

        # Perform scan
        response = requests.post('/scan', data={"domain": domain})

        scan_results = response.json()

        # Construct request payload for result-processor
        if scan_results is not None:
            payload = json.dumps({"results": scan_results, "scan_type": "https", "scan_id": scan_id})
            logging.info(str(scan_results))
        else:
            raise Exception("HTTPS scan not completed")

        # Dispatch results to result-processor
        requests.post('/dispatch', data=payload)

        return PlainTextResponse("HTTPS scan completed. Results dispatched for processing")

    except Exception as e:
        logging.error(str(e))
        return PlainTextResponse("An error occurred while attempting to perform HTTPS scan: %s" % str(e))


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


def scan_https(payload):

    domain = payload["domain"]

    try:
        # Run https-scanner
        res_dict = https.run([domain])

        # Return scan results for the designated domain
        return res_dict[domain]
    except Exception as e:
        logging.error("An error occurred while scanning domain - %s", str(e))
        return None


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


app = Server(functions={"dispatch": dispatch_results, "scan": scan_https})
