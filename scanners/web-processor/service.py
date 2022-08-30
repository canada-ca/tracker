import functools
import json
import logging
import asyncio
import os
import signal
import sys
import traceback
import re

from arango import ArangoClient
from dotenv import load_dotenv
import nats
from web_processor.web_processor import process_results


load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s')
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
    string = re.sub('_([a-z])', lambda match: match.group(1).upper(), string)
    # keep numbers seperated with hyphen
    string = re.sub('([0-9])_([0-9])', r'\1-\2', string)
    # remove underscore before numbers
    string = re.sub('_([0-9])', r'\1', string)
    # convert snakecase to camel
    string = re.sub('_([a-z])', lambda match: match.group(1).upper(), string)
    return string


def snake_to_camel(d):
    if isinstance(d, str):
        return d
    if isinstance(d, list):
        return [snake_to_camel(entry) for entry in d]
    if isinstance(d, dict):
        return {to_camelcase(a): snake_to_camel(b) if isinstance(b, (dict, list)) else b for a, b in d.items()}


async def processor_service(loop):
    async def error_cb(error):
        logger.error(error)

    async def closed_cb():
        logger.info("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    async def reconnected_cb():
        logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    nc = await nats.connect(
        error_cb=error_cb,
        closed_cb=closed_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
    )

    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

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

        logger.info(f"Starting web scan processing on '{domain}' at IP address '{ip_address}'")

        processed_results = process_results(results)

        if user_key is None:
            try:
                web_scan_entry = db.collection("webScan").get({'_key': web_scan_key})

                db.collection("webScan").update_match(
                    {'_key': web_scan_key},
                    {
                        "status": "complete",
                        "results": snake_to_camel(processed_results)
                    }
                )

                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsWeb").insert(
                    {"_from": domain["_id"], "timestamp": processed_results["timestamp"], "_to": web_scan_entry["_id"]}
                )

                if domain.get("status", None) == None:
                    domain.update(
                        {
                            "status": {
                                "https": "unknown",
                                "ssl": "unknown",
                                "dmarc": "unknown",
                                "dkim": "unknown",
                                "spf": "unknown",
                                "certificates": "fail",
                                "ciphers": "fail",
                                "curves": "fail",
                                "hsts": "fail",
                                "policy": "fail",
                                "protocols": "fail",
                            }
                        }
                    )

                domain["status"]["ssl"] = processed_results["tls_result"]["ssl_status"]
                domain["status"]["protocols"] = processed_results["tls_result"]["protocol_status"]
                domain["status"]["ciphers"] = processed_results["tls_result"]["cipher_status"]
                domain["status"]["curves"] = processed_results["tls_result"]["curve_status"]
                db.collection("domains").update(domain)

            except Exception as e:
                logging.error(
                    f"TLS processor: database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

    await nc.subscribe(subject=SUBSCRIBE_TO, queue=QUEUE_GROUP, cb=subscribe_handler)

    def ask_exit(sig_name):
        logger.error(f"Got signal {sig_name}: exit")
        if nc.is_closed:
            return
        loop.create_task(nc.close())

    for signal_name in {'SIGINT', 'SIGTERM'}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            functools.partial(ask_exit, signal_name))


def main():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(processor_service(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    main()
