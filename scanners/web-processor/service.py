import concurrent
import functools
import json
import logging
import asyncio
import os
import signal
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

import sys
import traceback
import re

from arango import ArangoClient
from dotenv import load_dotenv
import nats
from nats.errors import TimeoutError
from nats.js.api import RetentionPolicy, ConsumerConfig, AckPolicy

from web_processor.web_processor import process_results


load_dotenv()

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
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
            ack_wait=60,
        ),
    )

    async def subscribe_handler(msg):
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
                db.collection("domains").update(domain)

            except Exception as e:
                logger.error(
                    f"TLS processor: database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

        await msg.ack()

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

    def check_concurrent(msg):
        print(f"Starting concurrent check...: {msg}")
        n_loop = asyncio.new_event_loop()
        try:
            n_loop.run_until_complete(subscribe_handler(msg))
            print(f"Concurrent check done...: {msg}")
        finally:
            n_loop.close()

    while True:
        if exit_condition.should_exit:
            break
        if nc.is_closed:
            logger.error("Connection to NATS is closed.")
            break
        try:
            logger.info("Fetching message...")
            msgs = await sub.fetch(batch=5, timeout=5)
            logger.info(f"Received {len(msgs)} messages")
            with concurrent.futures.ThreadPoolExecutor() as executor:
                results = await asyncio.gather(
                    *[
                        loop.run_in_executor(
                            executor,
                            check_concurrent,
                            msg,
                        )
                        for msg in msgs
                    ]
                )

        except nats.errors.TimeoutError:
            logger.info("No messages available...")
            continue

    logger.info("Service is shutting down...")

    await nc.flush()
    await nc.close()


if __name__ == "__main__":
    asyncio.run(processor_service())
