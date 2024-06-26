import concurrent
import functools
import json
import logging
import asyncio
import os
import signal
import time
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

import sys
import traceback
import re

from arango import ArangoClient, DocumentUpdateError
from dotenv import load_dotenv
import nats
from nats.errors import TimeoutError
from nats.js.api import RetentionPolicy, ConsumerConfig, AckPolicy

from web_processor.web_processor import process_results


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

NAME = os.getenv("NAME", "web_processor")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.web.results")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "web-processor")
SERVER_LIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVER_LIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")


logging.basicConfig(level=logging.INFO)
# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def to_camelcase(string):
    string = string
    # remove underscore and uppercase following letter
    string = re.sub("_([a-z])", lambda match: match.group(1).upper(), string)
    # keep numbers seperated with hyphen
    string = re.sub("([0-9])_([0-9])", r"\1-\2", string)
    # remove underscore before numbers
    string = re.sub("_([0-9])", r"\1", string)
    # convert snakecase to camel
    string = re.sub("_([a-z])", lambda match: match.group(1).upper(), string)
    # replace hyper with underscore
    string = re.sub("-", r"_", string)
    return string


def snake_to_camel(d):
    if isinstance(d, str):
        return d
    if isinstance(d, list):
        return [snake_to_camel(entry) for entry in d]
    if isinstance(d, dict):
        return {
            to_camelcase(a): snake_to_camel(b) if isinstance(b, (dict, list)) else b
            for a, b in d.items()
        }


async def processor_service():
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
        subject="scans.web_scanner_results",
        durable="web_processor",
        config=ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    )

    def process_msg(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        logger.info(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)

        domain = payload.get("domain")
        results = payload.get("results")
        domain_key = payload.get("domain_key")
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")
        ip_address = payload.get("ip_address")
        web_scan_key = payload.get("web_scan_key")

        logger.info(
            f"Starting web scan processing on '{domain}' at IP address '{ip_address}'"
        )

        processed_results = process_results(results)

        if user_key is None:
            try:
                db.collection("webScan").update_match(
                    {"_key": web_scan_key},
                    {
                        "status": "complete",
                        "results": snake_to_camel(processed_results),
                    },
                )

                domain = db.collection("domains").get({"_key": domain_key})

                if domain.get("status", None) == None:
                    domain.update(
                        {
                            "status": {
                                "certificates": "info",
                                "ciphers": "info",
                                "curves": "info",
                                "dkim": "info",
                                "dmarc": "info",
                                "hsts": "info",
                                "https": "info",
                                "protocols": "info",
                                "spf": "info",
                                "ssl": "info",
                            }
                        }
                    )

                all_web_scan_cursor = db.aql.execute(
                    """
                    WITH web, webScan
                    FOR webV,e IN 1 ANY @web_scan_id webToWebScans
                        FOR webScanV, webScanE IN 1 ANY webV._id webToWebScans
                            FILTER webScanV.status == "complete"
                            RETURN {
                                "scan_status": webScanV.status,
                                "https_status": webScanV.results.connectionResults.httpsStatus,
                                "hsts_status": webScanV.results.connectionResults.hstsStatus,
                                "certificate_status": webScanV.results.tlsResult.certificateStatus,
                                "tls_result": webScanV.results.tlsResult,
                                "ssl_status": webScanV.results.tlsResult.sslStatus,
                                "protocol_status": webScanV.results.tlsResult.protocolStatus,
                                "cipher_status": webScanV.results.tlsResult.cipherStatus,
                                "curve_status": webScanV.results.tlsResult.curveStatus,
                                "blocked_category": webScanV.results.connectionResults.httpsChainResult.connections[0].connection.blockedCategory,
                            }
                    """,
                    bind_vars={"web_scan_id": f"webScan/{web_scan_key}"},
                )

                all_web_scans = [web_scan for web_scan in all_web_scan_cursor]
                https_statuses = []
                hsts_statuses = []
                ssl_statuses = []
                protocol_statuses = []
                cipher_statuses = []
                curve_statuses = []
                certificate_statuses = []
                blocked_categories = []
                scan_pending = False
                for web_scan in all_web_scans:
                    # Skip incomplete scans
                    if web_scan["scan_status"] != "complete":
                        scan_pending = True
                        continue
                    https_statuses.append(web_scan["https_status"])
                    hsts_statuses.append(web_scan["hsts_status"])
                    ssl_statuses.append(web_scan["ssl_status"])
                    protocol_statuses.append(web_scan["protocol_status"])
                    cipher_statuses.append(web_scan["cipher_status"])
                    curve_statuses.append(web_scan["curve_status"])
                    certificate_statuses.append(web_scan["certificate_status"])
                    blocked_categories.append(web_scan["blocked_category"])

                def get_status(statuses):
                    if "fail" in statuses:
                        return "fail"
                    elif "pass" in statuses:
                        return "pass"
                    else:
                        return "info"

                domain["status"]["https"] = get_status(https_statuses)
                domain["status"]["hsts"] = get_status(hsts_statuses)

                domain["status"]["ssl"] = get_status(ssl_statuses)
                domain["status"]["protocols"] = get_status(protocol_statuses)
                domain["status"]["ciphers"] = get_status(cipher_statuses)
                domain["status"]["curves"] = get_status(curve_statuses)
                domain["status"]["certificates"] = get_status(certificate_statuses)
                domain["blocked"] = any(
                    [bool(blocked_category) for blocked_category in blocked_categories]
                )
                domain["webScanPending"] = scan_pending

                del domain["_rev"]
                try:
                    db.collection("domains").update(domain)
                except DocumentUpdateError as e:
                    error_str = str(e)
                    start_retry = time.time()
                    document_updated = False
                    # Retry for 5 seconds in case another process is updating the same document
                    while time.time() - start_retry < 5:
                        try:
                            db.collection("domains").update(domain)
                            document_updated = True
                            break
                        except DocumentUpdateError as while_e:
                            time.sleep(0.1)
                            error_str = str(while_e)
                            continue
                    if not document_updated:
                        logger.error(
                            f"Error while updating domain after retrying for received message: {msg}: {error_str}"
                        )

            except Exception as e:
                logger.error(
                    f"Error while inserting processed results for received message: {msg}: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

        formatted_scan_data = {
            "results": processed_results,
            "domain": domain,
            "user_key": user_key,
            "domain_key": domain_key,
            "shared_id": shared_id,
        }

        return formatted_scan_data

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

    async def handle_finished_scan(fut, original_msg, semaphore):
        try:
            await fut
            res = fut.result()
            if isinstance(res, Exception):
                logger.error(f"Uncaught scan error: {res}")
                return

            scan_data = res
            try:
                await js.publish(
                    stream="SCANS",
                    subject="scans.web_processor_results",
                    payload=json.dumps(scan_data).encode(),
                )
            except TimeoutError as e:
                logger.error(
                    f"Timeout while publishing results: {scan_data}: for received message: {original_msg}: {e} \n\nFull traceback: {traceback.format_exc()}"
                )
                logger.error(f"{traceback.format_exc()}")
                return

            try:
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

    sem = asyncio.BoundedSemaphore(1)

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
                future = executor.submit(process_msg, msg)
                future.add_done_callback(
                    lambda fut: asyncio.create_task(
                        handle_finished_scan(fut=fut, original_msg=msg, semaphore=sem)
                    )
                )

            except Exception as e:
                logger.error(f"Error while queueing scan, releasing semaphore: {e}")
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
    asyncio.run(processor_service())
