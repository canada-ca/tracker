import os
import sys
import time
import requests
import logging
import json
import emoji
import traceback
import asyncio
import datetime as dt
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

QUEUE_URL = "http://result-queue.scanners.svc.cluster.local/https"


def dispatch_results(payload, client):
    client.post(QUEUE_URL, json=payload)
    logging.info("Scan results dispatched to result-processor")


def scan_https(domain):
    try:
        # Run https-scanner
        res_dict = https.run([domain])

        # Return scan results for the designated domain
        return res_dict[domain]
    except Exception as e:
        logging.error("An error occurred while scanning domain - %s", str(e))
        return None


def Server(server_client=requests):

    async def scan(scan_request):
        try:
            logging.info("Scan request received")
            start_time = dt.datetime.now()
            inbound_payload = await scan_request.json()
            try:
                domain = inbound_payload["domain"]
                scan_id = inbound_payload["scan_id"]
            except KeyError:
                msg = f"Invalid scan request format received: {str(inbound_payload)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            logging.info(f"(ID={scan_id}) Performing scan...")
            scan_results = scan_https(domain)

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "https", "scan_id": scan_id}
                )
                logging.info(f"(ID={scan_id}) Scan results: {str(scan_results)}")
            else:
                raise Exception("HTTPS scan not completed")

        except Exception as e:
            msg = f"(ID={scan_id}) An unexpected error occurred while attempting to process HTTPS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
            dispatch_results({"scan_type": "https", "scan_id": scan_id, "results": {}})
            return PlainTextResponse(msg)

        dispatch_results(outbound_payload, server_client)
        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        msg = f"(ID={scan_id}) HTTPS scan completed in {elapsed_time.total_seconds()} seconds."
        logging.info(msg)

        return PlainTextResponse(msg)


    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))


    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route('/', scan, methods=['POST']),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown])

    return starlette_app


app = Server()
