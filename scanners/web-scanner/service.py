import concurrent
import functools
import json
import logging
import asyncio
import os
import signal
import time
from dataclasses import dataclass

import sys

from dotenv import load_dotenv
from concurrent.futures import TimeoutError, ProcessPoolExecutor

from nats.js.api import RetentionPolicy, AckPolicy, ConsumerConfig

from scan.web_scanner import scan_web
import nats
from nats.errors import TimeoutError

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
logger = logging.getLogger()

NAME = os.getenv("NAME", "web-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.web")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "web-scanner")
SERVER_LIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVER_LIST.split(",")


def scan_web_and_catch(domain, ip_address):
    try:
        return scan_web(domain=domain, ip_address=ip_address)
    except Exception as e:
        logger.error(
            f"Error scanning '{domain}' at IP address '{ip_address}': {str(e)}"
        )


def process_results(results):
    # report = {}
    #
    # if results == {}:
    #     report = {"error": "unreachable"}
    # else:
    #     for version in [
    #         "SSL_2_0",
    #         "SSL_3_0",
    #         "TLS_1_0",
    #         "TLS_1_1",
    #         "TLS_1_2",
    #         "TLS_1_3",
    #     ]:
    #         if version in results["TLS"]["supported"]:
    #             report[version] = True
    #         else:
    #             report[version] = False
    #
    #     report["cipher_list"] = results["TLS"]["accepted_cipher_list"]
    #     report["signature_algorithm"] = results.get("signature_algorithm", "unknown")
    #     report["heartbleed"] = results.get("is_vulnerable_to_heartbleed", False)
    #     report["openssl_ccs_injection"] = results.get(
    #         "is_vulnerable_to_ccs_injection", False
    #     )
    #     report["supports_ecdh_key_exchange"] = results.get(
    #         "supports_ecdh_key_exchange", False
    #     )
    #     report["supported_curves"] = results.get("supported_curves", [])

    return results


# MessageData class contains required from the Msg for scan but nothing else.
# The async functions the Msg class contains causes pickle error due to
# it being passed to a different process while inside an asyncio event loop
@dataclass
class MessageData:
    subject: str
    reply: str
    data: bytes


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

    processed_results = process_results(scan_results)

    logger.info(
        f"Web results for '{domain}' at IP address '{str(ip_address)}': {json.dumps(processed_results)}"
    )

    formatted_results = {
        "results": processed_results,
        "user_key": user_key,
        "domain": domain,
        "domain_key": domain_key,
        "shared_id": shared_id,
        "ip_address": ip_address,
        "web_scan_key": web_scan_key,
    }

    logging.info(f"Formatted results: {formatted_results}")

    return msg, formatted_results


async def scan_service():
    loop = asyncio.get_running_loop()

    async def error_cb(error):
        logger.error(error)

    async def reconnected_cb():
        logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
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
        subject="scans.dns_processor_results",
        durable="web_scanner",
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

    async def handle_finished_scan(fut, msg, semaphore):
        try:
            await fut
            res = fut.result()
            if isinstance(res, Exception):
                logger.error(f"Uncaught scan error: {res}")
                return

            _msg, scan_data = res
            try:
                await js.publish(
                    stream="SCANS",
                    subject="scans.web_scanner_results",
                    payload=json.dumps(scan_data).encode(),
                )
            except TimeoutError as e:
                logger.error(f"Timeout while publishing results: {e}")
                return

            try:
                await msg.ack()
            except Exception as e:
                logger.error(f"Error while acknowledging message: {e}")
        finally:
            logger.debug("Releasing semaphore...")
            semaphore.release()

    sem = asyncio.Semaphore(1)

    # Use a ProcessPoolExecutor to run the scans concurrently.
    # sslyze has a memory leak that causes it to consume a lot of memory
    # after running for a while. This is a workaround to prevent the
    # memory leak from causing the service to crash.
    with concurrent.futures.ProcessPoolExecutor() as executor:
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
                logger.debug(f"Received message: {msgs}")
            except nats.errors.TimeoutError:
                logger.debug("No messages available...")
                sem.release()
                continue

            try:
                futures = [
                    loop.run_in_executor(
                        executor,
                        run_scan,
                        MessageData(
                            subject=msg.subject,
                            reply=msg.reply,
                            data=msg.data,
                        ),
                    )
                    for msg in msgs
                ]
                for index, future in enumerate(futures):
                    future.add_done_callback(
                        lambda fut: asyncio.create_task(
                            handle_finished_scan(fut, msgs[index], sem)
                        )
                    )
            except Exception as e:
                logger.error(f"Error while queuing scans: {e}")
                sem.release()

    logger.info("Service is shutting down...")

    await nc.flush()
    logger.info("Flushed NATS connection...")
    await nc.close()
    logger.info("Closed NATS connection...")


if __name__ == "__main__":
    asyncio.run(scan_service())
