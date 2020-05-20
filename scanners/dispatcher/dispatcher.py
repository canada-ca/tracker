import ast
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

    try:
        received_dict = ast.literal_eval(received_payload)

        payload = {
            "scan_id": received_dict["scan_id"],
            "domain": received_dict["domain"],
        }

        if scan_type == "web":
            requests.post('http://127.0.0.1:8000/https', data=payload)
            requests.post('http://127.0.0.1:8000/dmarc', data=payload)
            requests.post('http://127.0.0.1:8000/ssl', data=payload)
        elif scan_type == "mail":
            requests.post('http://127.0.0.1:8000/dkim', data=payload)
            requests.post('http://127.0.0.1:8000/dmarc', data=payload)
        else:
            raise Exception("Invalid Scan-Type provided")

        return "Scan request parsed successfully"

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return "Failed to dispatch domain to designated scanner(s): %s" % str(e)


def Server(scanners={}, client=requests):

    def receive(request):
        logging.info("Request received")
        return PlainTextResponse(initiate(request.headers.get("Data"), request.headers.get("Scan-Type")))

    async def dkim(request):
        logging.info("DKIM scan requested")
        payload = await request.json()
        response = scanners["dkim"](payload, client)
        return PlainTextResponse(response.text)

    async def dmarc(request):
        logging.info("DMARC scan requested")
        payload = await request.json()
        response = scanners["dmarc"](payload, client)
        return PlainTextResponse(response.text)

    async def https(request):
        logging.info("HTTPS scan requested")
        payload = await request.json()
        response = scanners["https"](payload, client)
        return PlainTextResponse(response.text)

    async def ssl(request):
        logging.info("SSL scan requested")
        payload = await request.json()
        response = scanners["ssl"](payload, client)
        return PlainTextResponse(response.text)

    routes = [
        Route('/dkim', dkim, methods=['POST']),
        Route('/dmarc', dmarc, methods=['POST']),
        Route('/https', https, methods=['POST']),
        Route('/ssl', ssl, methods=['POST']),
        Route('/receive', receive, methods=['POST']),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(scanners={"dkim": scan_dkim,
                       "dmarc": scan_dmarc,
                       "https": scan_https,
                       "ssl": scan_ssl})
