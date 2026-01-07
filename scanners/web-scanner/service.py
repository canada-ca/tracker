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

from nats.aio.msg import Msg
from nats.js import JetStreamContext
from nats.js.api import AckPolicy, ConsumerConfig
from nats.js.errors import KeyWrongLastSequenceError, KeyNotFoundError
from nats.js.kv import KeyValue

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

TASK_QUEUE = asyncio.Queue()
SEMAPHORE = asyncio.BoundedSemaphore(SCAN_THREAD_COUNT)
EXECUTOR = ThreadPoolExecutor(max_workers=SCAN_THREAD_COUNT)
SHUTDOWN_EVENT = asyncio.Event()

instance_id = str(uuid.uuid4())

running_tasks = set()

logger.info(f"Starting web scanner service with instance ID: {instance_id}")


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
            logger.error(f"Error acquiring IP slot for {ip}: {e}")
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
                    logger.info(f"Wrong last sequence for {ip}: {entry.revision}")
                    await asyncio.sleep(0.1)
                    continue
        except KeyNotFoundError:
            logger.info(f"IP slot for {ip} not found to release")
            return  # Key not found, nothing to release
        except Exception as e:
            error_retries += 1
            logger.error(f"Unexpected error releasing IP slot for {ip}: {e}")
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
        # Ensure jetstream consumer is still present
        context.sub = await js.pull_subscribe(**pull_subscribe_options)
        context.priority_sub = await js.pull_subscribe(
            **priority_pull_subscribe_options
        )
        context.ip_kv = await js.key_value(bucket="WEB_SCANNER_IPS")
        logger.info("Re-subscribed to NATS...")

    async def work_consumer():
        while not SHUTDOWN_EVENT.is_set():
            try:
                msg: Msg = await asyncio.wait_for(TASK_QUEUE.get(), timeout=1)
                logger.debug(f"Consumer fetched message. Queue size: {TASK_QUEUE.qsize()}")
            except asyncio.TimeoutError:
                continue  # No tasks available. Check SHUTDOWN_EVENT and try again

            task_success = False
            task_cancelled = False

            try:
                async with SEMAPHORE:
                    logger.debug(f"Consumer acquired semaphore.")
                    task = loop.run_in_executor(EXECUTOR, run_scan, msg)
                    running_tasks.add(task)
                    result = await task
                    if isinstance(result, Exception):
                        logger.error(
                            f"Uncaught scan error for received message: {msg}: {result}"
                        )
                        running_tasks.discard(task)
                        # Attempt to scan again
                        task = loop.run_in_executor(EXECUTOR, run_scan, msg)
                        running_tasks.add(task)
                        result = await task
                        if isinstance(result, Exception):
                            logger.error(
                                f"Uncaught scan error for received message after retry. Terminating message: {msg}: {result}"
                            )
                            running_tasks.discard(task)
                            await msg.term()
                            continue

                    scan_data = result
                    try:
                        original_headers = msg.headers
                        await js.publish(
                            stream="SCANS",
                            subject="scans.web_scanner_results",
                            payload=json.dumps(scan_data).encode(),
                            headers=original_headers,
                        )
                    except TimeoutError as e:
                        logger.error(
                            f"Timeout while publishing results: {scan_data}: for received message: {msg}: {e} \n\nFull traceback: {traceback.format_exc()}"
                        )
                        continue

                    task_success = True

            except asyncio.CancelledError:
                logger.error("Task cancelled...")
                task_cancelled = True
                continue
            except Exception as e:
                logger.error(f"Uncaught error while processing message: {msg}: {e}")
            finally:
                if task_cancelled:
                    logger.error(
                        "Task was cancelled, msg and IP slot cannot be cleaned up"
                    )
                else:
                    try:
                        if task_success:
                            logger.debug(f"Acknowledging message: {msg}")
                            await msg.ack()
                            logger.debug(f"Message acknowledged: {msg}")
                    except Exception as e:
                        logger.error(
                            f"Error while acknowledging message for received message: {msg}: {e}"
                        )

                    try:
                        ip_address = json.loads(msg.data).get("ip_address")
                        logger.debug(f"Releasing IP address: {ip_address}")
                        await release_ip_slot(context.ip_kv, ip_address)
                        logger.debug(f"Released IP address: {ip_address}")
                    except Exception as e:
                        logger.error(
                            f"Error while releasing IP slot for received message: {msg}: {e}"
                        )

                running_tasks.discard(task)
                TASK_QUEUE.task_done()

                logger.debug(f"Task completed for message: {msg}")
        logger.debug(f"Consumer shutting down...")

    async def work_producer():
        # Only check priority message every 0.5 seconds
        # (to help prevent starvation from large blocks of the same IP address in the main queue)
        time_to_check_priority = time.monotonic() + 0.5

        while not SHUTDOWN_EVENT.is_set():
            logger.debug(f"Producer loop iteration. Queue size: {TASK_QUEUE.qsize()}")
            # Only get new tasks if there are available slots in the semaphore (i.e. not all threads are busy)
            async with SEMAPHORE:
                logger.debug(f"Producer acquired semaphore.")
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
                        await asyncio.sleep(1)
                        continue

                ip = json.loads(msg.data).get("ip_address")
                if not ip:
                    logger.error(f"Invalid IP address in message: {msg}")
                    await msg.ack()
                    continue

                if not await try_acquire_ip_slot(context.ip_kv, ip):
                    logger.debug(
                        f"Unable to acquire slot for IP address: {ip}, requeuing..."
                    )
                    #  Unable to acquire slot, requeue (Nak) message with delay
                    await msg.nak(delay=3)
                    await asyncio.sleep(1)
                    continue

                try:
                    await TASK_QUEUE.put(msg)
                except Exception as e:
                    logger.error(f"Error while queueing scans: {e}")
        logger.info("Producer shutting down...")

    async def shutdown():
        logger.info("Shutting down...")
        SHUTDOWN_EVENT.set()

        # Patiently wait for all tasks to finish (up to 90 seconds)
        try:
            await asyncio.wait_for(asyncio.gather(*running_tasks), timeout=3)
        except asyncio.TimeoutError:
            logger.error("Timeout waiting for tasks to finish...")

        await nc.flush()
        logger.info("Flushed NATS connection...")
        await nc.close()
        logger.info("Closed NATS connection...")

    def ask_exit(sig_name):
        if context.should_exit_time:
            return
        logger.info(f"Got signal {sig_name}: exit")
        context.should_exit_time = time.time()
        loop.create_task(shutdown())

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(getattr(signal, signal_name), ask_exit, signal_name)

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
        drain_timeout=30,
    )
    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    context.ip_kv = await js.key_value(bucket="WEB_SCANNER_IPS")

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.dns_processor_results",
        "durable": "web_scanner",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=-1,
            max_waiting=100_000,
            ack_wait=900,
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
            ack_wait=900,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)
    context.priority_sub = await js.pull_subscribe(**priority_pull_subscribe_options)

    workers = [asyncio.create_task(work_consumer()) for _ in range(SCAN_THREAD_COUNT)]
    producer = asyncio.create_task(work_producer())

    try:
        await asyncio.gather(*workers, producer, return_exceptions=True)
    except asyncio.CancelledError:
        logger.info("Service shut down")


if __name__ == "__main__":
    asyncio.run(scan_service())
