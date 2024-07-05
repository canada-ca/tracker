import asyncio

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

LOGGER_LEVEL = os.getenv("LOGGER_LEVEL", "INFO")

logger_level = logging.getLevelName(LOGGER_LEVEL)
if not isinstance(logger_level, int):
    print(f"Invalid logger level: {LOGGER_LEVEL}")
    sys.exit(1)

logging.basicConfig(
    stream=sys.stdout,
    level=logger_level,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

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


def to_json(msg):
    print(json.dumps(msg, indent=2))


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

    return formatted_scan_data


async def run():
    loop = asyncio.get_running_loop()

    async def error_cb(error):
        logger.error(f"Uncaught error in callback: {error}")

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
            ack_wait=90,
        ),
    )

    @dataclass
    class ExitCondition:
        should_exit: bool = False

    exit_condition = ExitCondition()

    async def ask_exit(sig_name):
        if exit_condition.should_exit is True:
            return
        logger.error(f"Got signal {sig_name}: exit")
        exit_condition.should_exit = True

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            lambda: asyncio.create_task(ask_exit(signal_name)),
        )

    async def handle_finished_scan(fut, original_msg, semaphore):
        try:
            await fut
            res = fut.result()
            if isinstance(res, Exception):
                logger.error(
                    f"Uncaught scan error for received message: {original_msg}: {res}"
                )
                return

            scan_data = res
            try:
                await js.publish(
                    stream="SCANS",
                    subject="scans.dns_scanner_results",
                    payload=json.dumps(scan_data).encode(),
                )
            except TimeoutError as e:
                logger.error(
                    f"Timeout while publishing results: {scan_data}: for received message: {original_msg}: {e} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

            try:
                logger.debug(f"Acknowledging message: {original_msg}")
                await original_msg.ack()
            except Exception as e:
                logger.error(
                    f"Error while acknowledging message for received message: {original_msg}: {e}"
                )
        finally:
            logger.debug("Releasing semaphore...")
            try:
                semaphore.release()
            except Exception as e:
                logger.error(
                    f"Error while releasing semaphore for received message: {original_msg}: {e}"
                )

    sem = asyncio.BoundedSemaphore(2)

    with concurrent.futures.ThreadPoolExecutor() as executor:
        while True:
            if exit_condition.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            await sem.acquire()

            if exit_condition.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            try:
                logger.debug("Fetching message...")
                msgs = await sub.fetch(batch=1, timeout=1)
                msg = msgs[0]
                logger.debug(f"Received message: {msg}")
            except nats.errors.TimeoutError:
                logger.debug("No messages available...")
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
                continue

            try:
                future = loop.run_in_executor(executor, run_scan, msg)
                loop.create_task(
                    handle_finished_scan(fut=future, original_msg=msg, semaphore=sem)
                )
            except Exception as e:
                logger.error(
                    f"Error while queueing scans for received message: {msg}: releasing semaphore: {e}"
                )
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )

    logger.info("Service is shutting down...")

    await nc.flush()
    logger.info("Flushed NATS connection...")
    await nc.close()
    logger.info("Closed NATS connection...")


if __name__ == "__main__":
    asyncio.run(run())
