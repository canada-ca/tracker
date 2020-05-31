import os
import sys
import requests
import logging
import json
import emoji
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/process", json=payload
    )


def scan_https(domain):
    try:
        # Run https-scanner
        res_dict = https.run([domain])

        # Return scan results for the designated domain
        return res_dict[domain]
    except Exception as e:
        logging.error("An error occurred while scanning domain - %s", str(e))
        return None


def Server(default_client=requests):

    async def scan(request):
        try:
            client = request.app.state.client

            logging.info("Scan request received")
            inbound_payload = await request.json()
            domain = inbound_payload["domain"]
            scan_id = inbound_payload["scan_id"]

            logging.info("Performing scan...")
            scan_results = scan_https(domain)

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "https", "scan_id": scan_id}
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("HTTPS scan not completed")
            dispatch_results(outbound_payload, client)
        except Exception as e:
            return PlainTextResponse(f"An error occurred while attempting to process HTTPS scan request: {str(e)}")

        return PlainTextResponse("HTTPS scan completed. Scan results dispatched to result-processor")

    routes = [
        Route("/scan", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server()
