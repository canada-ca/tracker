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
from multiprocessing import Process, Manager
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response
from starlette.middleware.errors import ServerErrorMiddleware

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

MIN_HSTS_AGE = 31536000  # one year
TIMEOUT = 80  # 80 second scan timeout

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)


class ScanTimeoutException(BaseException):
    pass


def dispatch_results(payload, client):
    client.post(QUEUE_URL + "/https", json=payload)
    logging.info("Scan results dispatched to result queue")


def scan_https(domain, res_dict):
    try:
        # Run https-scanner
        res_dict["results"] = https.run([domain])

        # Return scan results for the designated domain
        return res_dict
    except Exception as e:
        logging.error(f"An error occurred while scanning domain: {e}")
        return None


def process_results(results):
    logging.info("Processing HTTPS scan results...")
    report = {}

    if results is None or results == {}:
        report = {"missing": True}

    else:
        # Assumes that HTTPS would be technically present, with or without issues
        if results["Downgrades HTTPS"]:
            https = "Downgrades HTTPS"  # No
        else:
            if results["Valid HTTPS"]:
                https = "Valid HTTPS"  # Yes
            elif results["HTTPS Bad Chain"] and not results["HTTPS Bad Hostname"]:
                https = "Bad Chain"  # Yes
            else:
                https = "Bad Hostname"  # No

        report["implementation"] = https

        # Is HTTPS enforced?

        if https in ["Downgrades HTTPS", "Bad Hostname"]:
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

        if results["HSTS Max Age"]:
            hsts_age = int(results["HSTS Max Age"])
        else:
            hsts_age = None

        # Otherwise, without HTTPS there can be no HSTS for the domain directly.
        if https == "Downgrades HTTPS" or https == "Bad Hostname":
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
                raise ScanTimeoutException("Scan timed out")
            time.sleep(interval)


    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()
        start_time = dt.datetime.now()

        try:
            domain = inbound_payload["domain"]
            uuid = inbound_payload["uuid"]
            domain_key = inbound_payload["domain_key"]
        except KeyError:
            logging.error(f"Invalid scan request format received: {str(inbound_payload)}")
            return Response("Invalid Format", status_code=400)

        logging.info("Performing scan...")

        try:
            manager = Manager()
            result_dict = manager.dict()
            p = Process(target=scan_https, args=(domain, result_dict))
            wait_timeout(p, TIMEOUT)
        except ScanTimeoutException:
            return Response("Timeout occurred while scanning", status_code=500)

        scan_results = result_dict.values()[0].get(domain)

        if scan_results is not None:

            processed_results = process_results(scan_results)

            outbound_payload = json.dumps(
                {
                    "results": processed_results,
                    "scan_type": "https",
                    "uuid": uuid,
                    "domain_key": domain_key,
                }
            )
            logging.info(f"Scan results: {str(processed_results)}")
        else:
            raise Exception("HTTPS scan not completed")

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client)

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
