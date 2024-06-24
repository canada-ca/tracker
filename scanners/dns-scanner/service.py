import asyncio
import time
import traceback

import sys
import concurrent
import json
import logging
import os
import signal
from concurrent.futures import TimeoutError
from dataclasses import dataclass

import nats
from arango import ArangoClient
from dotenv import load_dotenv
from nats.js.api import RetentionPolicy, ConsumerConfig, AckPolicy
from nats.errors import TimeoutError

from dns_scanner.dns_scanner import scan_domain

load_dotenv()

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
)
logger = logging.getLogger()

NAME = os.getenv("NAME", "dns-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "dns-scanner")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def run_scan(msg):
    subject = msg.subject
    reply = msg.reply
    data = msg.data.decode()
    logger.info(
        "Received a message on '{subject} {reply}': {data}".format(
            subject=subject, reply=reply, data=data
        )
    )
    payload = json.loads(msg.data)

    domain = payload.get("domain")
    user_key = payload.get("user_key")
    shared_id = payload.get("shared_id")

    # Check if domain exists in DB
    domain_doc_cursor = db.collection("domains").find({"domain": domain}, limit=1)

    try:
        domain_doc = domain_doc_cursor.next()
    except IndexError:
        logger.error(f"Domain '{domain}' not found in DB")
        return

    domain_key = domain_doc.get("_key")
    domain_id = domain_doc.get("_id")

    # Get DKIM selectors from DB
    try:
        connected_selectors_cursor = db.aql.execute(
            """
            FOR selector, e IN 1 ANY @domain domainsToSelectors
                RETURN selector
            """,
            bind_vars={"domain": domain_id},
        )
        connected_selector_docs = [sel for sel in connected_selectors_cursor]
        connected_selector_strings = [
            sel["selector"] for sel in connected_selector_docs
        ]
    except Exception as e:
        logger.error(f"Error getting selectors for domain '{domain}': {e}")
        return

    try:
        logger.info(
            f"Scanning {domain} with DKIM selectors '{str(connected_selector_strings)}'"
        )
        scan_results = scan_domain(
            domain=domain, dkim_selectors=connected_selector_strings
        )

    except TimeoutError:
        logger.error(f"Timeout while scanning {domain}")
        scan_results = {
            "dmarc": {"error": "missing"},
            "spf": {"error": "missing"},
            "mx": {"error": "missing"},
            "dkim": {"error": "missing"},
        }

    formatted_scan_data = {
        "results": scan_results,
        "domain": domain,
        "user_key": user_key,
        "domain_key": domain_key,
        "shared_id": shared_id,
    }

    return msg, formatted_scan_data


def to_json(msg):
    print(json.dumps(msg, indent=2))


async def run():
    loop = asyncio.get_running_loop()

    async def error_cb(error):
        logger.error(f"MY ERROR: {error}")

    async def reconnected_cb():
        logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
        drain_timeout=30,
    )
    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    await js.add_stream(
        name="SCANS",
        subjects=[
            "scans.requests",
            "scans.dns_scanner_results",
            "scans.dns_processor_results",
            "scans.web_scanner_results",
            "scans.web_processor_results",
        ],
        retention=RetentionPolicy.WORK_QUEUE,
    )
    sub = await js.pull_subscribe(
        stream="SCANS",
        subject="scans.requests",
        durable="dns_scanner",
        config=ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=60,
        ),
    )

    logger.info(f"Subscribed to '{SUBSCRIBE_TO}'")

    @dataclass
    class ExitCondition:
        should_exit: bool = False

    exit_condition = ExitCondition()

    async def ask_exit(sig_name):
        logger.error(f"Got signal {sig_name}: exit")
        exit_condition.should_exit = True

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            lambda: asyncio.create_task(ask_exit(signal_name)),
        )

    while True:
        if exit_condition.should_exit:
            break
        if nc.is_closed:
            logger.error("Connection to NATS is closed.")
            break
        try:
            logger.info("Fetching message...")
            msgs = await sub.fetch(batch=5)
            logger.info(f"Received {len(msgs)} messages")
            with concurrent.futures.ThreadPoolExecutor() as executor:
                futures = [
                    loop.run_in_executor(
                        executor,
                        run_scan,
                        msg,
                    )
                    for msg in msgs
                ]
                results = await asyncio.gather(*futures, return_exceptions=True)

                for res in results:
                    if isinstance(res, Exception):
                        logger.error(f"Uncaught scan error: {res}")
                        continue

                    msg, scan_data = res
                    try:
                        await js.publish(
                            stream="SCANS",
                            subject="scans.dns_scanner_results",
                            payload=json.dumps(scan_data).encode(),
                        )
                    except TimeoutError as e:
                        logger.error(f"Timeout while publishing results: {e}")
                        logger.error(f"{traceback.format_exc()}")
                        continue

                    try:
                        await msg.ack()
                    except Exception as e:
                        logger.error(f"Error while acknowledging message: {e}")
                        continue

        except nats.errors.TimeoutError:
            logger.info("No messages available...")
            continue

    logger.info("Service is shutting down...")

    await nc.flush(timeout=5)
    logger.info("Flushed NATS connection...")
    await nc.close()
    logger.info("Closed NATS connection...")


if __name__ == "__main__":
    asyncio.run(run())
