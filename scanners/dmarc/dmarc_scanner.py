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
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/process", json=payload
    )


def scan_dmarc(domain):

    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(
            "Failed to check the given domains for DMARC/SPF records: %s" % str(e)
        )
        return None

    if scan_result["dmarc"].get("record", "null") == "null":
        return None
    else:
        return scan_result


def Server(default_client=requests):
    async def scan(request):
        try:
            client = request.app.state.client

            logging.info("Scan request received")
            inbound_payload = await request.json()
            domain = inbound_payload["domain"]
            scan_id = inbound_payload["scan_id"]

            logging.info("Performing scan...")
            scan_results = scan_dmarc(domain)

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "dmarc", "scan_id": scan_id}
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("DMARC scan not completed")
            dispatch_results(outbound_payload, client)
        except Exception as e:
            return PlainTextResponse(
                f"An error occurred while attempting to process DMARC scan request: {str(e)}"
            )

        return PlainTextResponse(
            "DMARC scan completed. Scan results dispatched to result-processor"
        )

    routes = [
        Route("/scan", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server()
