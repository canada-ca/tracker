import os
import json
import emoji
import sys
import logging
import requests
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from utils import *

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def initiate(received_payload, scan_type):

    logging.info("Request received")

    try:
        received_dict = json.loads(received_payload)

        payload = {
            "scan_id": received_dict["scan_id"],
            "domain": received_dict["domain"],
        }

        if scan_type == "web":
            requests.get('/https', data=payload)
            requests.get('/dmarc', data=payload)
            requests.get('/ssl', data=payload)
        elif scan_type == "mail":
            requests.get('/dkim', data=payload)
            requests.get('/dmarc', data=payload)
        else:
            raise Exception("Invalid Scan-Type provided")

        return "Scan request parsed successfully"

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return "Failed to dispatch domain to designated scanner(s): %s" % str(e)


def Server(scanners={}, client=requests):

    def receive(request):
        return PlainTextResponse(initiate(request.headers.get("Data"), request.headers.get("Scan-Type")))

    def dkim(request):
        return PlainTextResponse(scanners["scan_dkim"](request.json(), client))

    def dmarc(request):
        return PlainTextResponse(scanners["scan_dmarc"](request.json(), client))

    def https(request):
        return PlainTextResponse(scanners["scan_https"](request.json(), client))

    def ssl(request):
        return PlainTextResponse(scanners["scan_ssl"](request.json(), client))

    routes = [
        Route('/dkim', dkim),
        Route('/dmarc', dmarc),
        Route('/https', https),
        Route('/ssl', ssl),
        Route('/receive', receive),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(scanners={"dkim": scan_dkim,
                       "dmarc": scan_dmarc,
                       "https": scan_https,
                       "ssl": scan_ssl})
