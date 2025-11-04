import asyncio
import time

import traceback

import sys
import json
import logging
import os
import signal
from concurrent.futures import TimeoutError
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import nats
from arango import ArangoClient
from dotenv import load_dotenv
from nats.js import JetStreamContext
from nats.js.api import RetentionPolicy, ConsumerConfig, AckPolicy
from nats.errors import TimeoutError as NatsTimeoutError

load_dotenv()

from dns_scanner.dns_scanner import scan_domain

LOGGER_LEVEL = os.getenv("LOGGER_LEVEL", "INFO")

logger_level = logging.getLevelName(LOGGER_LEVEL)
if not isinstance(logger_level, int):
    print(f"Invalid logger level: {LOGGER_LEVEL}")
    sys.exit(1)

# Split logging to stdout and stderr
# DEBUG and INFO to stdout
# WARNING and above to stderr
h1 = logging.StreamHandler(sys.stdout)
h1.setLevel(logging.DEBUG)
h1.addFilter(lambda record: record.levelno <= logging.INFO)
h2 = logging.StreamHandler(sys.stderr)
h2.setLevel(logging.WARNING)

logging.basicConfig(
    level=logger_level,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
    handlers=[h1, h2],
)
logger = logging.getLogger(__name__)

NAME = os.getenv("NAME", "dns-scanner")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

SCAN_THREAD_COUNT = int(os.getenv("SCAN_THREAD_COUNT", 1))

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def to_json(msg):
    print(json.dumps(msg, indent=2))


def run_scan(msg):
    start_time = time.monotonic()
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

    end_time = time.monotonic()
    # Truncate to 2 decimal places for duration
    duration_seconds = round(end_time - start_time, 2)

    scan_results["duration_seconds"] = duration_seconds

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

    @dataclass
    class Context:
        should_exit: bool = False
        sub: JetStreamContext.PullSubscription = None
        priority_sub: JetStreamContext.PullSubscription = None

    context = Context()

    async def error_cb(error):
        logger.error(f"Uncaught error in callback: {error}")

    async def reconnected_cb():
        logger.info(f"Reconnected to NATS at {nc.connected_url.netloc}...")
        # Ensure jetstream stream and consumer are still present
        await js.add_stream(**add_stream_options)
        context.sub = await js.pull_subscribe(**pull_subscribe_options)
        context.priority_sub = await js.pull_subscribe(
            **priority_pull_subscribe_options
        )
        logger.info("Re-subscribed to NATS...")

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
        drain_timeout=30,
    )
    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    add_stream_options = {
        "name": "SCANS",
        "subjects": [
            "scans.requests",
            "scans.requests_priority",
            "scans.discovery",
            "scans.add_domain_to_easm",
            "scans.dns_scanner_results",
            "scans.dns_processor_results",
            "scans.dns_processor_results_priority",
            "scans.web_scanner_results",
            "scans.web_processor_results",
        ],
        "retention": RetentionPolicy.WORK_QUEUE,
    }

    await js.add_stream(**add_stream_options)

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.requests",
        "durable": "dns_scanner",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }
    priority_pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.requests_priority",
        "durable": "dns_scanner_priority",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)
    context.priority_sub = await js.pull_subscribe(**priority_pull_subscribe_options)

    async def ask_exit(sig_name):
        if context.should_exit is True:
            return
        logger.error(f"Got signal {sig_name}: exit")
        context.should_exit = True

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
                original_headers = original_msg.headers
                await js.publish(
                    stream="SCANS",
                    subject="scans.dns_scanner_results",
                    payload=json.dumps(scan_data).encode(),
                    headers=original_headers,
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

    sem = asyncio.BoundedSemaphore(SCAN_THREAD_COUNT)

    with ThreadPoolExecutor() as executor:
        # Only check priority message every 0.5 seconds
        time_to_check_priority = time.monotonic() + 0.5
        while True:
            if context.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            await sem.acquire()

            if context.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            msg = None

            # Check for priority messages first
            if time.monotonic() > time_to_check_priority:
                try:
                    logger.debug("Fetching priority message...")
                    msgs = await context.priority_sub.fetch(batch=1, timeout=0.5)
                    msg = msgs[0]
                    logger.debug(f"Received priority message: {msg}")
                except NatsTimeoutError:
                    msg = None
                    logger.debug("No priority messages available...")
                finally:
                    time_to_check_priority = time.monotonic() + 0.5

            if not msg:
                try:
                    logger.debug("Fetching message...")
                    msgs = await context.sub.fetch(batch=1, timeout=1)
                    msg = msgs[0]
                    logger.debug(f"Received message: {msg}")
                except NatsTimeoutError:
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
