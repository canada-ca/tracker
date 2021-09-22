import time
import json
import argparse, sys
import logging
import asyncio
import os
import signal
import traceback
import datetime as dt
from concurrent.futures import ThreadPoolExecutor
from operator import itemgetter
from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from tls_scanner import TLSScanner
from nats.aio.client import Client as NATS

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

NAME = os.getenv("NAME", "tls-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")


def to_json(msg):
    print(json.dumps(msg, indent=2))


def process_results(results):
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

    return report


async def run(loop):
    nc = NATS()

    async def error_cb(e):
        print("Error:", e)

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
        print(
            "Received a message on '{subject} {reply}': {data}".format(
                subject=subject, reply=reply, data=data
            )
        )
        payload = json.loads(msg.data)

        domain = payload["domain"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]
        selectors = payload["selectors"]

        try:
            scanner = TLSScanner(domain)

            loop = asyncio.get_event_loop()
            executor = ThreadPoolExecutor()
            scan_results = await loop.run_in_executor(executor, scanner.run)
        except TimeoutError:
            await nc.publish(
                f"{PUBLISH_TO}.{domain_key}.tls",
                json.dumps(
                    {
                        "results": {"error": "unreachable"},
                        "scan_type": "ssl",
                        "user_key": user_key,
                        "domain_key": domain_key,
                        "shared_id": shared_id,
                    }
                ).encode(),
            )

        processed_results = process_results(scan_results)

        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.tls",
            json.dumps(
                {
                    "results": processed_results,
                    "scan_type": "ssl",
                    "user_key": user_key,
                    "domain_key": domain_key,
                    "shared_id": shared_id,
                }
            ).encode(),
        )

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
