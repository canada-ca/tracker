import json
import logging
import asyncio
import os
import signal
import traceback

from dataclasses import dataclass

import sys

from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from concurrent.futures import ThreadPoolExecutor

from nats.js import JetStreamContext
from nats.js.api import RetentionPolicy, AckPolicy, ConsumerConfig
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


def scan_web_and_catch(domain, ip_address):
    try:
        return scan_web(domain=domain, ip_address=ip_address)
    except Exception as e:
        logger.error(
            f"Error scanning '{domain}' at IP address '{ip_address}': {str(e)}"
        )


def run_scan(msg):
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
    max_retries = 3
    retries = 0

    while retries < max_retries:
        try:
            entry = await kv.get(ip)
            count = int(entry.value.decode())

            if count < MAX_SLOTS_PER_IP:
                try:
                    await kv.update(ip, str(count + 1).encode(), entry.revision)
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
            await kv.create(ip, b"1")
            return True
        except Exception as e:
            logging.error(f"Error acquiring IP slot for {ip}: {e}")
            retries += 1
            await asyncio.sleep(0.1)

    return False  # Failed after max retries


async def release_ip_slot(kv: KeyValue, ip: str) -> None:
    error_retries = 0

    while True:
        try:
            entry = await kv.get(ip)
            count = int(entry.value.decode())

            if count > 0:
                try:
                    await kv.update(ip, str(count - 1).encode(), entry.revision)
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
        should_exit: bool = False
        sub: JetStreamContext.PullSubscription = None

    context = Context()

    async def error_cb(error):
        logger.error(f"Uncaught error in callback: {error}")

    async def reconnected_cb():
        logger.info(f"Reconnected to NATS at {nc.connected_url.netloc}...")
        # Ensure jetstream stream and consumer are still present
        await js.add_stream(**add_stream_options)
        context.sub = await js.pull_subscribe(**pull_subscribe_options)
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
            "scans.discovery",
            "scans.add_domain_to_easm",
            "scans.dns_scanner_results",
            "scans.dns_processor_results",
            "scans.web_scanner_results",
            "scans.web_processor_results",
        ],
        "retention": RetentionPolicy.WORK_QUEUE,
    }

    await js.add_stream(**add_stream_options)

    ip_kv = await js.create_key_value(bucket="WEB_SCANNER_IPS")

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.dns_processor_results",
        "durable": "web_scanner",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)

    async def ask_exit(sig_name):
        if context.should_exit is True:
            return
        logger.info(f"Got signal {sig_name}: exit")
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
                await js.publish(
                    stream="SCANS",
                    subject="scans.web_scanner_results",
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

    sem = asyncio.BoundedSemaphore(SCAN_THREAD_COUNT)

    with ThreadPoolExecutor() as executor:
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

            if not await try_acquire_ip_slot(ip_kv, ip):
                logger.debug(
                    f"Unable to acquire slot for IP address: {ip}, requeuing..."
                )
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
                await msg.nak(delay=10)
                continue

            try:
                future = loop.run_in_executor(executor, run_scan, msg)
                loop.create_task(
                    handle_finished_scan(fut=future, original_msg=msg, semaphore=sem)
                )
            except Exception as e:
                logger.error(f"Error while queueing scans, releasing semaphore: {e}")
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
    asyncio.run(scan_service())
