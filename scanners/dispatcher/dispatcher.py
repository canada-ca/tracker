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


async def initiate_scan(payload, scanners, client):

    try:
        dispatched = {}

        for scan_type, dispatch_function in scanners.items():
            dispatched[scan_type] = dispatch_function(payload, client)

        for key in dispatched:
            dispatched[key] = await dispatched[key]

        for key, val in dispatched.items():
            if val != f"Dispatched to {key} scanner":
                raise Exception(f"Failed to dispatch scan to {key} scanner")

        return "Scan successfully dispatched to designated scanners"

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return f"Failed to dispatch scan to designated scanner(s): {str(e)}"


def Server(scanners, default_client=requests):
    async def receive(request):
        logging.info("Request received")
        client = request.app.state.client
        inbound_payload = ast.literal_eval(request.headers.get("Data"))
        scan_type = request.headers.get("Scan-Type")
        manual = inbound_payload["user_init"]

        outbound_payload = {
            "scan_id": inbound_payload["scan_id"],
            "domain": inbound_payload["domain"],
        }

        logging.info("Scan request parsed successfully")

        if manual is True:
            web_scanners = {
                "https": scanners["https"]["manual"],
                "ssl": scanners["ssl"]["manual"],
                "dmarc": scanners["dmarc"]["manual"],
            }
            mail_scanners = {
                "dkim": scanners["dkim"]["manual"],
                "dmarc": scanners["dmarc"]["manual"],
            }
        else:
            web_scanners = {
                "https": scanners["https"]["auto"],
                "ssl": scanners["ssl"]["auto"],
                "dmarc": scanners["dmarc"]["auto"],
            }
            mail_scanners = {
                "dkim": scanners["dkim"]["auto"],
                "dmarc": scanners["dmarc"]["auto"],
            }

        if scan_type == "web":
            return PlainTextResponse(
                await initiate_scan(outbound_payload, web_scanners, client)
            )
        elif scan_type == "mail":
            return PlainTextResponse(
                await initiate_scan(outbound_payload, mail_scanners, client)
            )
        else:
            return PlainTextResponse("Invalid Scan-Type provided")

    routes = [
        Route("/receive", receive, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server(
    scanners={
        "dkim": {"auto": scan_dkim, "manual": manual_scan_dkim},
        "dmarc": {"auto": scan_dmarc, "manual": manual_scan_dmarc},
        "https": {"auto": scan_https, "manual": manual_scan_https},
        "ssl": {"auto": scan_ssl, "manual": manual_scan_ssl},
    }
)
