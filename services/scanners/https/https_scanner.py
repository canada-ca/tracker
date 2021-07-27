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
from ctypes import c_char_p
from multiprocessing import Process, Queue
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response
from starlette.middleware.errors import ServerErrorMiddleware

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

MIN_HSTS_AGE = 31536000  # one year
TIMEOUT = 80  # 80 second scan timeout
RES_QUEUE = Queue()

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)
OTS_QUEUE_URL = os.getenv(
    "OTS_RESULT_QUEUE_URL", "http://ots-result-queue.scanners.svc.cluster.local"
)
DEST_URL = lambda ots : OTS_QUEUE_URL if ots else QUEUE_URL


class ScanTimeoutException(BaseException):
    pass


def dispatch_results(payload, client, ots):
    client.post(DEST_URL(ots) + "/https", json=payload)
    logging.info("Scan results dispatched to result queue")


def scan_https(domain):
    try:
        # Run https-scanner
        RES_QUEUE.put(https.run([domain]).get(domain))
    except Exception as e:
        logging.error(f"An error occurred while scanning domain: {e}")
        RES_QUEUE.put({})


def process_results(results):
    logging.info("Processing HTTPS scan results...")
    report = {}

    if results == {} or not results["Live"]:
        report = {"error": "missing"}

    else:
        if results["Valid HTTPS"]:
            https = "Valid HTTPS"  # Yes
        elif results["HTTPS Bad Chain"]:
            https = "Bad Chain"  # Yes
        elif results["Downgrades HTTPS"]:
            https = "Downgrades HTTPS"  # No
        else:
            https = "No HTTPS"

        report["implementation"] = https

        # Is HTTPS enforced?

        if https == "Downgrades HTTPS":
            behavior = "Not Enforced"  # N/A

        else:

            # "Strict" means HTTP immediately redirects to HTTPS,
            # *and* that HTTP eventually redirects to HTTPS.
            #
            # Since a pure redirector domain can't "default" to HTTPS
            # for itself, we'll say it "Enforces HTTPS" if it immediately
            # redirects to an HTTPS URL.
            if results["Strictly Forces HTTPS"] and (
                results["Defaults to HTTPS"] or results["Redirect"]
            ):
                behavior = "Strict"  # Yes (Strict)

            # "Moderate" means HTTP eventually redirects to HTTPS.
            elif not results["Strictly Forces HTTPS"] and results["Defaults to HTTPS"]:
                behavior = "Moderate"  # Yes

            # Either both are False, or just 'Strict Force' is True,
            # which doesn't matter on its own.
            # A "present" is better than a downgrade.
            else:
                behavior = "Weak"  # Present (considered 'No')

        report["enforced"] = behavior

        ###
        # Characterize the presence and completeness of HSTS.
        hsts_age = results.get("HSTS Max Age", None)

        if hsts_age is not None:
            hsts_age = int(hsts_age)

        # Otherwise, without HTTPS there can be no HSTS for the domain directly.
        if https == "Downgrades HTTPS":
            hsts = "No HSTS"  # N/A (considered 'No')

        else:

            # HSTS is present for the canonical endpoint.
            if results["HSTS"] and hsts_age is not None:

                # Say No for too-short max-age's, and note in the extended details.
                if hsts_age >= MIN_HSTS_AGE:
                    hsts = "HSTS Fully Implemented"  # Yes, directly
                else:
                    hsts = "HSTS Max Age Too Short"  # No
            else:
                hsts = "No HSTS"  # No

        # Separate preload status from HSTS status:
        #
        # * Domains can be preloaded through manual overrides.
        # * Confusing to mix an endpoint-level decision with a domain-level decision.
        if results["HSTS Preloaded"]:
            preloaded = "HSTS Preloaded"  # Yes
        elif results["HSTS Preload Ready"]:
            preloaded = "HSTS Preload Ready"  # Ready for submission
        else:
            preloaded = "HSTS Not Preloaded"  # No

        # Certificate info
        if results["HTTPS Expired Cert"]:
            expired = True
        else:
            expired = False

        if results["HTTPS Self Signed Cert"]:
            self_signed = True
        else:
            self_signed = False

        if results["HTTPS Cert Revoked"] is None:
            revoked = "Unknown"
        elif results["HTTPS Cert Revoked"]:
            revoked = "Revoked"
        else:
            revoked = "Valid"

        report["hsts"] = hsts
        report["hsts_age"] = hsts_age
        report["preload_status"] = preloaded
        report["expired_cert"] = expired
        report["self_signed_cert"] = self_signed
        report["cert_revocation_status"] = revoked
        report["cert_bad_hostname"] = results["HTTPS Bad Hostname"]

    return report


def Server(server_client=requests):


    def wait_timeout(proc, seconds):
        proc.start()
        start = time.time()
        end = start + seconds
        interval = min(seconds / 1000.0, .25)

        while True:
            result = proc.is_alive()
            if not result:
                proc.join()
                return
            if time.time() >= end:
                proc.terminate()
                proc.join()
                logging.error("Timeout while scanning")
                raise ScanTimeoutException("Scan timed out")
            time.sleep(interval)


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
            p = Process(target=scan_https, args=(domain,))
            wait_timeout(p, TIMEOUT)
        except ScanTimeoutException:
            outbound_payload = json.dumps(
                {
                    "results": {"error": "unreachable"},
                    "scan_type": "https",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id
                }
            )
            dispatch_results(outbound_payload, server_client, (user_key is not None))
            return Response("Timeout occurred while scanning", status_code=500)
        scan_results = RES_QUEUE.get()

        processed_results = process_results(scan_results)

        outbound_payload = {
            "results": processed_results,
            "scan_type": "https",
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id
        }
        logging.info(f"Scan results: {str(processed_results)}")

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client, (user_key is not None))

        logging.info(f"HTTPS scan completed in {elapsed_time.total_seconds()} seconds.")
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
