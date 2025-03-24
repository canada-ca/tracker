import json
import logging
import asyncio
import os
import signal
import time
import traceback
import uuid

from dataclasses import dataclass

import sys

from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from concurrent.futures import ThreadPoolExecutor

from nats.js import JetStreamContext
from nats.js.api import RetentionPolicy, AckPolicy, ConsumerConfig
from nats.js.errors import KeyWrongLastSequenceError, KeyNotFoundError
from nats.js.kv import KeyValue

from ip_cleanup import leader_election_service
from scan.web_scanner import scan_web
import nats
from nats.errors import TimeoutError as NatsTimeoutError

load_dotenv()

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

NAME = os.getenv("NAME", "web-scanner")
SERVER_LIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVER_LIST.split(",")

SCAN_THREAD_COUNT = int(os.getenv("SCAN_THREAD_COUNT", 1))
MAX_SLOTS_PER_IP = int(os.getenv("MAX_SLOTS_PER_IP", 2))

instance_id = str(uuid.uuid4())

logger.info(f"Starting web scanner service with instance ID: {instance_id}")


class BoundedSemaphoreWithCount(asyncio.BoundedSemaphore):
    def __init__(self, initial):
        super().__init__(initial)
        self._count = initial

    async def acquire(self):
        result = await super().acquire()
        if result:
            self._count -= 1
            logger.debug(f"Acquired slot, count: {self._count}")
        return result

    def release(self):
        super().release()
        self._count += 1
        logger.debug(f"Released slot, count: {self._count}")

    def available(self):
        # Number of available slots
        return self._count


def scan_web_and_catch(domain, ip_address):
    try:
        return scan_web(domain=domain, ip_address=ip_address)
    except Exception as e:
        logger.error(
            f"Error scanning '{domain}' at IP address '{ip_address}': {str(e)}"
        )


def run_scan(msg):
    start_time = time.monotonic()
    subject = msg.subject
    reply = msg.reply
    data = msg.data.decode()
    logger.info(f"Received a message on '{subject} {reply}': {data}")
    payload = json.loads(msg.data)

    domain = payload.get("domain")
    domain_key = payload.get("domain_key")
    user_key = payload.get("user_key")
    shared_id = payload.get("shared_id")
    ip_address = payload.get("ip_address")
    web_scan_key = payload.get("web_scan_key")

    scan_results = scan_web_and_catch(domain, ip_address)

    end_time = time.monotonic()
    # Truncate to 2 decimal places for duration
    duration_seconds = round(end_time - start_time, 2)

    scan_results["duration_seconds"] = duration_seconds

    logger.info(
        f"Web results for '{domain}' at IP address '{str(ip_address)}': {json.dumps(scan_results)}"
    )

    formatted_results = {
        "results": scan_results,
        "user_key": user_key,
        "domain": domain,
        "domain_key": domain_key,
        "shared_id": shared_id,
        "ip_address": ip_address,
        "web_scan_key": web_scan_key,
    }

    logger.info(f"Formatted results: {formatted_results}")

    return formatted_results


async def try_acquire_ip_slot(kv: KeyValue, ip: str) -> bool:
    # Try to acquire a slot to scan the IP address
    max_retries = 3
    retries = 0

    while retries < max_retries:
        try:
            entry = await kv.get(ip)
            entry_data = json.loads(entry.value.decode())
            count = entry_data.get("count", 0)

            if count < MAX_SLOTS_PER_IP:
                try:
                    await kv.update(
                        ip,
                        json.dumps(
                            {"count": count + 1, "updated_at": int(time.time())}
                        ).encode(),
                        entry.revision,
                    )
                    return True
                except KeyWrongLastSequenceError:
                    retries += 1
                    await asyncio.sleep(0.1)
                    continue
                except Exception as e:
                    logger.error(f"Unexpected error acquiring IP slot for {ip}: {e}")
                    raise
            else:
                return False  # No slots available
        except KeyNotFoundError:
            await kv.create(
                ip, json.dumps({"count": 1, "updated_at": int(time.time())}).encode()
            )
            return True
        except Exception as e:
            logging.error(f"Error acquiring IP slot for {ip}: {e}")
            retries += 1
            await asyncio.sleep(0.1)

    return False  # Failed after max retries


async def release_ip_slot(kv: KeyValue, ip: str) -> None:
    # Release the slot for the IP address
    error_retries = 0

    while True:
        try:
            entry = await kv.get(ip)
            entry_data = json.loads(entry.value.decode())
            count = entry_data.get("count", 0)

            if count > 0:
                try:
                    await kv.update(
                        ip,
                        json.dumps(
                            {"count": count - 1, "updated_at": int(time.time())}
                        ).encode(),
                        entry.revision,
                    )
                    return
                except KeyWrongLastSequenceError:
                    await asyncio.sleep(0.1)
                    continue
        except KeyNotFoundError:
            return  # Key not found, nothing to release
        except Exception as e:
            error_retries += 1
            logging.error(f"Unexpected error releasing IP slot for {ip}: {e}")
            if error_retries > 10:
                logger.critical(
                    f"Error releasing IP slot for {ip}. Giving up after 10 retries. Error: {e}"
                )
                raise
            await asyncio.sleep(0.1)


async def scan_service():
    loop = asyncio.get_running_loop()

    @dataclass
    class Context:
        should_exit_time: float = 0
        sub: JetStreamContext.PullSubscription = None
        priority_sub: JetStreamContext.PullSubscription = None
        ip_kv: KeyValue = None
        leaders_kv: KeyValue = None

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
        context.ip_kv = await js.create_key_value(bucket="WEB_SCANNER_IPS")
        context.leaders_kv = await js.create_key_value(bucket="LEADERS")
        logger.info("Re-subscribed to NATS...")

    def ready_to_exit():
        # Force exit after 90 seconds
        force_exit_seconds = 90
        if time.monotonic() - context.should_exit_time > force_exit_seconds:
            logger.info(f"Forcing exit after {force_exit_seconds} seconds...")
            return True
        # Wait for all tasks to finish
        if sem.available() < SCAN_THREAD_COUNT:
            logger.info(
                f"Waiting for all tasks to finish...: sem={sem.available()} < SCAN_THREAD_COUNT={SCAN_THREAD_COUNT}"
            )
            return False
        return True

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

    context.ip_kv = await js.create_key_value(bucket="WEB_SCANNER_IPS")
    context.leaders_kv = await js.create_key_value(bucket="LEADERS")

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.dns_processor_results",
        "durable": "web_scanner",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=-1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }
    priority_pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.dns_processor_results_priority",
        "durable": "web_scanner_priority",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=-1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)
    context.priority_sub = await js.pull_subscribe(**priority_pull_subscribe_options)

    async def ask_exit(sig_name):
        if context.should_exit_time:
            return
        logger.info(f"Got signal {sig_name}: exit")
        context.should_exit_time = time.monotonic()

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            lambda: asyncio.create_task(ask_exit(signal_name)),
        )

    asyncio.create_task(leader_election_service(js, instance_id))

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
                    subject="scans.web_scanner_results",
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
            # Ensure IP slot is released before releasing semaphore. NATS connection may be closed after releasing semaphore.
            try:
                logger.debug(f"Releasing IP slot for message: {original_msg}")
                await release_ip_slot(
                    context.ip_kv, json.loads(original_msg.data).get("ip_address")
                )
            except Exception as e:
                logger.error(
                    f"Error while releasing IP slot for received message: {original_msg}: {e}"
                )
            try:
                logger.debug(f"Releasing semaphore for message: {original_msg}")
                semaphore.release()
            except Exception as e:
                logger.error(
                    f"Error while releasing semaphore for received message: {original_msg}: {e}"
                )

    sem = BoundedSemaphoreWithCount(SCAN_THREAD_COUNT)

    logger.debug(f"Initial semaphore count: {sem.available()}")

    with ThreadPoolExecutor() as executor:
        # Only check priority message every 0.5 seconds
        # (to help prevent starvation from large blocks of the same IP address in the main queue)
        time_to_check_priority = time.monotonic() + 0.5
        while True:
            if context.should_exit_time:
                break

            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            await sem.acquire()

            if context.should_exit_time:
                sem.release()
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

            ip = json.loads(msg.data).get("ip_address")
            if not ip:
                logger.error(f"Invalid IP address in message: {msg}")
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
                await msg.ack()
                continue

            if not await try_acquire_ip_slot(context.ip_kv, ip):
                logger.debug(
                    f"Unable to acquire slot for IP address: {ip}, requeuing..."
                )
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
                #  Unable to acquire slot, requeue (Nak) message with delay
                await msg.nak(delay=3)
                continue

            try:
                future = loop.run_in_executor(executor, run_scan, msg)
                loop.create_task(
                    handle_finished_scan(fut=future, original_msg=msg, semaphore=sem)
                )
            except Exception as e:
                logger.error(f"Error while queueing scans, releasing semaphore: {e}")
                try:
                    await release_ip_slot(context.ip_kv, ip)
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
        # Wait for all tasks to finish before shutting down
        while True:
            if ready_to_exit():
                logger.debug("All tasks finished, or forced exit")
                break
            logger.debug("Waiting for all tasks to finish...")
            await asyncio.sleep(1)

    logger.info("Service is shutting down...")

    await nc.flush()
    logger.info("Flushed NATS connection...")
    await nc.close()
    logger.info("Closed NATS connection...")


if __name__ == "__main__":
    asyncio.run(scan_service())
