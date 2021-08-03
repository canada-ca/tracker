import sys
import os
import time
import requests
import logging
import json
import emoji
import dkim
import asyncio
import nacl
import base64
import tldextract
import traceback
import datetime as dt
from checkdmarc import *
from dns import resolver
from dkim import dnsplug, crypto, KeyFormatError
from dkim.util import InvalidTagValueList
from concurrent.futures import TimeoutError
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response
from dns_scanner import DMARCScanner, DKIMScanner

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = os.getenv("SCAN_TIMEOUT", 80)

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)
OTS_QUEUE_URL = os.getenv(
    "OTS_RESULT_QUEUE_URL", "http://ots-result-queue.scanners.svc.cluster.local"
)
DEST_URL = lambda ots : OTS_QUEUE_URL if ots else QUEUE_URL


def dispatch_results(payload, client, ots):
    client.post(DEST_URL(ots) + "/dns", json=json.dumps(payload))
    logging.info("Scan results dispatched to result queue")


def Server(server_client=requests):


    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        start_time = dt.datetime.now()
        try:
            domain = inbound_payload["domain"]
            user_key = inbound_payload["user_key"]
            selectors = inbound_payload.get("selectors", [])
            domain_key = inbound_payload["domain_key"]
            shared_id = inbound_payload["shared_id"]
        except KeyError:
            logging.error(f"Invalid scan request format received: {str(inbound_payload)}")
            return Response("Invalid Format", status_code=400)

        try:
            scanner = DMARCScanner(domain)
            start = time.time()

            future = scanner.run()
            scan_results = future.result()

            if len(selectors) != 0:
                scanner = DKIMScanner(domain, selectors)
                start = time.time()

                future = scanner.run()
                scan_results["dkim"] = future.result()
            else:
                logging.info("No DKIM selector strings provided")
                scan_results["dkim"] = {"error": "missing"}

        except TimeoutError:
            logging.error(f"Timeout while scanning {domain} (Aborted after {round(time.time()-start, 2)} seconds)")
            outbound_payload = json.dumps(
                {
                    "results": {
                        "dmarc": {"error": "missing"},
                        "spf": {"error": "missing"},
                        "mx": {"error": "missing"},
                        "dkim": {"error": "missing"},
                    },
                    "scan_type": "dns",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id
                }
            )
            dispatch_results(outbound_payload, server_client, (user_key is not None))
            return Response("Timeout occurred while scanning", status_code=500)

        outbound_payload = {
            "results": scan_results,
            "scan_type": "dns",
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id
        }
        logging.info(f"Scan results: {str(scan_results)}")

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client, (user_key is not None))

        logging.info(f"DNS scan completed in {elapsed_time.total_seconds()} seconds.")
        return Response("Scan completed")


    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))


    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route("/", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(
        debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown]
    )

    return starlette_app


app = Server()
