import os
import emoji
import sys
import logging
import requests
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from utils import *

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started... :rocket:"))


def initiate(request):

    logging.info("Request received")

    try:
        received_payload = request.headers.get("Data")
        scan_type = request.headers.get("Scan-Type")

        payload = {
            "scan_id": received_payload["scan_id"],
            "domain": received_payload["domain"],
        }

        if scan_type == "web":
            requests.post('/https', data=payload)
            requests.post('/dmarc', data=payload)
            requests.post('/ssl', data=payload)
        elif scan_type == "mail":
            requests.post('/dkim', data=payload)
            requests.post('/dmarc', data=payload)
        else:
            raise Exception("Invalid Scan-Type provided")

        return PlainTextResponse("Scan request parsed successfully")

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return PlainTextResponse("Failed to dispatch domain to designated scanner(s): %s" % str(e))


def Server(scanners={}, client=requests):

    def receive(request):
        return PlainTextResponse(initiate(request))

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
