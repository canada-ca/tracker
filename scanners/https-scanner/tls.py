from dotenv import load_dotenv
import time

from concurrent.futures import ThreadPoolExecutor
import json
import argparse, sys
import asyncio
import os
import signal
from https_scanner import HTTPSScanner
from nats.aio.client import Client as NATS

MIN_HSTS_AGE = 31536000  # one year

load_dotenv()

NAME = os.getenv("NAME", "https-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("SERVERS")
SERVERS = SERVERLIST.split(",")


def to_json(msg):
    print(json.dumps(msg, indent=2))


def process_results(results):
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


async def run(loop):
    nc = NATS()

    async def error_cb(e):
        print("Nats Error callback invoked:", e)

    async def closed_cb():
        print("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    async def reconnected_cb():
        print(f"Connected to NATS at {nc.connected_url.netloc}...")

    async def subscribe_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        print(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)
        domain = payload["domain"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]

        loop = asyncio.get_event_loop()
        start_time = time.monotonic()
        print(f"before the scanner")
        with ThreadPoolExecutor() as executor:
            scanner = HTTPSScanner(domain)
            scan_results = await loop.run_in_executor(executor, scanner.run)
        print(f"After scan. Elapsed time: {time.monotonic() - start_time}")
        processed_results = process_results(scan_results)
        print(f"After processing. Elapsed time: {time.monotonic() - start_time}")
        print(json.dumps({"process_results": process_results}))
        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.https",
            json.dumps(
                {
                    "results": processed_results,
                    "scan_type": "https",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id,
                }
            ).encode(),
        )

    options = {}

    try:
        await nc.connect(
            loop=loop,
            error_cb=error_cb,
            closed_cb=closed_cb,
            reconnected_cb=reconnected_cb,
            servers=SERVERS,
            name=NAME,
        )
    except Exception as e:
        print(e)

    print(f"Connected to NATS at {nc.connected_url.netloc}...")

    def signal_handler():
        if nc.is_closed:
            return
        print("Disconnecting...")
        loop.create_task(nc.close())

    for sig in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, sig), signal_handler)

    await nc.subscribe(SUBSCRIBE_TO, QUEUE_GROUP, subscribe_handler)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()
