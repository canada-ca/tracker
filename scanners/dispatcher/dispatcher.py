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

        logging.info("Scan request parsed successfully")

        dispatched = {}
        if scan_type == "web":
            dispatched["https"] = requests.post(
                "http://127.0.0.1:8000/https", json=payload
            )
            dispatched["dmarc"] = requests.post(
                "http://127.0.0.1:8000/dmarc", json=payload
            )
            dispatched["ssl"] = requests.post("http://127.0.0.1:8000/ssl", json=payload)
        elif scan_type == "mail":
            dispatched["dkim"] = requests.post(
                "http://127.0.0.1:8000/dkim", json=payload
            )
            dispatched["dmarc"] = requests.post(
                "http://127.0.0.1:8000/dmarc", json=payload
            )
        else:
            raise Exception("Invalid Scan-Type provided")

        for key, val in dispatched.items():
            if val.text is not f"Dispatched to {key} scanner":
                raise Exception(f"Failed to dispatch scan to {key} scanner")

        return "All scans successfully dispatched to designated scanners"

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return f"Failed to dispatch scan to designated scanner(s): {str(e)}"


def Server(scanners={}, client=requests):
    def receive(request):
        logging.info("Request received")
        return PlainTextResponse(
            initiate(request.headers.get("Data"), request.headers.get("Scan-Type"))
        )

    async def dkim(request):
        logging.info("DKIM scan requested")
        try:
            payload = await request.json()
            scanners["dkim"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Dispatched to DKIM scanner")

    async def dmarc(request):
        logging.info("DMARC scan requested")
        try:
            payload = await request.json()
            scanners["dmarc"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Dispatched to DMARC scanner")

    async def https(request):
        logging.info("HTTPS scan requested")
        try:
            payload = await request.json()
            scanners["https"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Dispatched to HTTPS scanner")

    async def ssl(request):
        logging.info("SSL scan requested")
        try:
            payload = await request.json()
            scanners["ssl"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Dispatched to SSL scanner")

    routes = [
        Route("/dkim", dkim, methods=["POST"]),
        Route("/dmarc", dmarc, methods=["POST"]),
        Route("/https", https, methods=["POST"]),
        Route("/ssl", ssl, methods=["POST"]),
        Route("/receive", receive, methods=["POST"]),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


app = Server(
    scanners={
        "dkim": scan_dkim,
        "dmarc": scan_dmarc,
        "https": scan_https,
        "ssl": scan_ssl,
    }
)
