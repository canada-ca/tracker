import os
import sys
import time
import requests
import logging
import json
import emoji
import asyncio
import traceback
import scapy
import datetime as dt
from enum import Enum
from concurrent.futures import TimeoutError
from OpenSSL import SSL
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response
from socket import gaierror
from sslyze.server_connectivity import ServerConnectivityTester
from sslyze.errors import ConnectionToServerFailed, ServerHostnameCouldNotBeResolved
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.connection_helpers.tls_connection import SslConnection
from sslyze.scanner import Scanner, ServerScanRequest
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkLocationViaDirectConnection,
    ServerNetworkConfiguration,
)
from ssl_scanner import SSLScanner

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = os.getenv("SCAN_TIMEOUT", 80)

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)
OTS_QUEUE_URL = os.getenv(
    "OTS_RESULT_QUEUE_URL", "http://ots-result-queue.scanners.svc.cluster.local"
)
DEST_URL = lambda ots : OTS_QUEUE_URL if ots else QUEUE_URL


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


def dispatch_results(payload, client, ots):
    client.post(DEST_URL(ots) + "/ssl", json=json.dumps(payload))
    logging.info("Scan results dispatched to result queue")


def process_results(results):
    logging.info("Processing SSL scan results...")
    report = {}

    if results == {}:
        report = {"error": "unreachable"}
    else:
        for version in [
            "SSL_2_0",
            "SSL_3_0",
            "TLS_1_0",
            "TLS_1_1",
            "TLS_1_2",
            "TLS_1_3",
        ]:
            if version in results["TLS"]["supported"]:
                report[version] = True
            else:
                report[version] = False

        report["cipher_list"] = results["TLS"]["accepted_cipher_list"]
        report["signature_algorithm"] = results.get("signature_algorithm", "unknown")
        report["heartbleed"] = results.get("is_vulnerable_to_heartbleed", False)
        report["openssl_ccs_injection"] = results.get(
            "is_vulnerable_to_ccs_injection", False
        )
        report["supports_ecdh_key_exchange"] = results.get(
            "supports_ecdh_key_exchange", False
        )
        report["supported_curves"] = results.get("supported_curves", [])

    logging.info(f"Processed SSL scan results: {str(report)}")
    return report


def Server(server_client=requests):


    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        start_time = dt.datetime.now()
        try:
            domain = inbound_payload["domain"]
            user_key = inbound_payload["user_key"]
            domain_key = inbound_payload["domain_key"]
            shared_id = inbound_payload["shared_id"]
        except KeyError:
            logging.error(f"Invalid scan request format received: {str(inbound_payload)}")
            return Response("Invalid Format", status_code=400)

        logging.info("Performing scan...")

        try:
            scanner = SSLScanner(domain)
            start = time.time()

            future = scanner.run()
            scan_results = future.result()
        except TimeoutError:
            logging.error(f"Timeout while scanning {domain} (Aborted after {round(time.time()-start, 2)} seconds)")
            outbound_payload = json.dumps(
                {
                    "results": {"error": "unreachable"},
                    "scan_type": "ssl",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id
                }
            )
            dispatch_results(outbound_payload, server_client, (user_key is not None))
            return Response("Timeout occurred while scanning", status_code=500)

        processed_results = process_results(scan_results)

        outbound_payload = {
            "results": processed_results,
            "scan_type": "ssl",
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id
        }
        logging.info(f"Scan results: {str(scan_results)}")

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client, (user_key is not None))

        logging.info(f"SSL scan completed in {elapsed_time.total_seconds()} seconds.")
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
