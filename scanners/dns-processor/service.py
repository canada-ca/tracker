import datetime
import functools
import json
import asyncio
import os
import signal
import logging
import sys
import traceback
import re

from dotenv import load_dotenv
from arango import ArangoClient
import nats

from dns_processor.dns_processor import process_results

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s')
logger = logging.getLogger()

NAME = os.getenv("NAME", "dns-processor")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

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


async def run(loop):
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

        results = payload.get("results")
        domain_key = payload.get("domain_key")
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")

        processed_results = process_results(results)

        dmarc_status = processed_results.get("dmarc").get("status")
        spf_status = processed_results.get("spf").get("status")
        dkim_status = processed_results.get("dkim").get("status")

        if user_key is None:
            try:
                dns_entry = db.collection("dns").insert(snake_to_camel(processed_results))

                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsDNS").insert(
                    {
                        "_from": domain["_id"],
                        "timestamp": processed_results["timestamp"],
                        "_to": dns_entry["_id"]
                    }
                )

                web_entry = db.collection("web").insert({
                    "timestamp": str(datetime.datetime.utcnow()),
                })

                if domain.get("status", None) is None:
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

                for key, val in {
                    "dmarc": dmarc_status,
                    "spf": spf_status,
                    "dkim": dkim_status,
                }.items():
                    domain["status"][key] = val

                dmarc_phase = processed_results.get("dmarc").get("results").get("phase")

                domain.update({"phase": dmarc_phase})
                db.collection("domains").update(domain)

                for ip in results["resolve_ips"]:
                    web_scan = db.collection("webScan").insert({
                        "status": "pending",
                        "ip_address": ip
                    })
                    db.collection("webToWebScans").insert({
                        "_from": web_entry["_id"],
                        "_to": web_scan["_id"],
                    })

                    await nc.publish(
                        f"{PUBLISH_TO}.{domain_key}.web",
                        json.dumps(
                            {
                                "user_key": user_key,
                                "domain": domain["domain"],
                                "domain_key": domain_key,
                                "shared_id": shared_id,
                                "ip_address": ip,
                                "web_scan_key": web_scan["_key"]
                            }
                        ).encode(),
                    )



            except Exception as e:
                logging.error(
                    f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

            logging.info(f"DNS Scans inserted into database: {json.dumps(processed_results)}")

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
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    main()
