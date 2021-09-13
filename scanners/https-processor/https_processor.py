import os
import re
import sys
import time
import json
import logging
import traceback
import random
import datetime
from concurrent.futures import ThreadPoolExecutor
from arango import ArangoClient
from utils import retrieve_tls_guidance
import asyncio
import signal
from nats.aio.client import Client as NATS

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")
NATS_URL = os.getenv("NATS_URL", "nats://127.0.0.1:4222")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.https")
PUBLISH_TO = os.getenv("PUBLISH_TO")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def publish_results(results, scan_type, user_key):
    print(json.dumps(results, indent=2))


def process_https(results, domain_key, user_key, shared_id):
    timestamp = str(datetime.datetime.utcnow())
    neutral_tags = []
    positive_tags = []
    negative_tags = []

    if results.get("error") == "missing":
        negative_tags.append("https2")
    elif results.get("error") == "unreachable":
        neutral_tags.append("https17")
    else:
        # Certificate does not match host name
        if results.get("cert_bad_hostname"):
            negative_tags.append("https5")

        # Implementation
        implementation = results.get("implementation", None)

        if implementation is not None:
            if isinstance(implementation, str):
                implementation = implementation.lower()

            if implementation == "downgrades https":
                negative_tags.append("https3")
            elif implementation == "bad chain":
                negative_tags.append("https4")
            elif implementation == "bad hostname":
                negative_tags.append("https5")

        # Enforced
        enforced = results.get("enforced", None)

        if enforced is not None:
            if isinstance(enforced, str):
                enforced = enforced.lower()

            if enforced == "moderate":
                negative_tags.append("https8")
            elif enforced == "weak":
                negative_tags.append("https7")
            elif enforced == "not enforced":
                negative_tags.append("https6")

        # HSTS
        hsts = results.get("hsts", None)

        if hsts is not None:
            if isinstance(hsts, str):
                hsts = hsts.lower()

                if hsts == "hsts max age too short":
                    negative_tags.append("https10")

                elif hsts == "no hsts":
                    negative_tags.append("https9")

            # HSTS Age
            hsts_age = results.get("hsts_age", None)

            if hsts_age is not None:
                if hsts_age < 31536000:
                    if "https9" not in negative_tags and "https10" not in negative_tags:
                        negative_tags.append("https10")

            # Preload Status
            preload_status = results.get("preload_status", None)

            if preload_status is not None:
                if isinstance(preload_status, str):
                    preload_status = preload_status.lower()

                    if preload_status == "hsts preload ready":
                        neutral_tags.append("https11")

                    elif preload_status == "hsts not preloaded":
                        neutral_tags.append("https12")

        else:
            negative_tags.append("https9")

        # Expired Cert
        expired_cert = results.get("expired_cert", False)

        if expired_cert is True:
            negative_tags.append("https13")

        # Self Signed Cert
        self_signed_cert = results.get("self_signed_cert", False)

        if self_signed_cert is True:
            negative_tags.append("https14")

        revocation_status = results.get("cert_revocation_status", "Unknown")

        if revocation_status == "Revoked":
            negative_tags.append("https15")

        elif revocation_status == "Unknown":
            neutral_tags.append("https16")

    httpsResults = {
        "timestamp": timestamp,
        "implementation": results.get("implementation", None),
        "enforced": results.get("enforced", None),
        "hsts": results.get("hsts", None),
        "hstsAge": results.get("hsts_age", None),
        "preloaded": results.get("preload_status", None),
        "rawJson": results,
        "neutralTags": neutral_tags,
        "positiveTags": positive_tags,
        "negativeTags": negative_tags,
    }

    # get https status
    if "https17" in neutral_tags:
        https_status = "info"
    elif len(negative_tags) > 0:
        https_status = "fail"
    else:
        https_status = "pass"

    if user_key is None:
        try:
            httpsEntry = db.collection("https").insert(httpsResults)
            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsHTTPS").insert(
                {"_from": domain["_id"], "_to": httpsEntry["_id"]}
            )

            if domain.get("status", None) == None:
                domain.update(
                    {
                        "status": {
                            "https": "unknown",
                            "ssl": "unknown",
                            "dmarc": "unknown",
                            "dkim": "unknown",
                            "spf": "unknown",
                        }
                    }
                )
            domain["status"]["https"] = https_status
            db.collection("domains").update(domain)

        except Exception as e:
            logging.error(
                f"HTTPS insertion error: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logging.info("HTTPS Scan inserted into database")
        return {
            "sharedId": shared_id,
            "domainKey": domain_key,
            "status": https_status,
            "results": httpsResults,
        }
    else:
        # One time scan publish to redis
        publish_results(
            {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": https_status,
                "results": httpsResults,
            },
            "https",
            user_key,
        )
        return {
            "sharedId": shared_id,
            "domainKey": domain_key,
            "status": https_status,
            "results": httpsResults,
        }


async def run(loop):
    nc = NATS()

    async def closed_cb():
        print("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    # It is very likely that the demo server will see traffic from clients other than yours.
    # To avoid this, start your own locally and modify the example to use it.
    options = {"servers": [NATS_URL], "loop": loop, "closed_cb": closed_cb}

    await nc.connect(**options)
    print(f"Connected to NATS at {nc.connected_url.netloc}...")

    async def subscribe_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        print(
            "Received a message on'{subject} {reply}': {data}".format(
                subject=subject, reply=reply, data=data
            )
        )
        payload = json.loads(msg.data)
        results = payload["results"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]

        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor()
        processed = await loop.run_in_executor(
            executor, lambda: process_https(results, domain_key, user_key, shared_id)
        )
        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.https.processed", json.dumps(processed).encode()
        )

    # Subscription on queue named 'workers' so that
    # one subscriber handles message a request at a time.
    await nc.subscribe(SUBSCRIBE_TO, "httpsprocessor", subscribe_handler)

    def signal_handler():
        if nc.is_closed:
            return
        print("Disconnecting...")
        loop.create_task(nc.close())

    for sig in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, sig), signal_handler)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()
