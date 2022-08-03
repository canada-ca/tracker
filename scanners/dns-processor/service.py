import datetime
import functools
import json
import asyncio
import os
import signal
import logging
import traceback

from dotenv import load_dotenv
from arango import ArangoClient
import nats

from dns_processor.dns_processor import process_results

load_dotenv()

logging.basicConfig(level=logging.INFO)
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
        # shared_id = payload.get("shared_id")

        print(json.dumps(results, indent=4))

        processed_results = process_results(results)

        dmarc = processed_results.get("dmarc")
        dmarc_status = dmarc.get("status")

        spf = processed_results.get("spf")
        spf_status = spf.get("status")

        dkim = processed_results.get("dkim")
        dkim_status = dkim.get("status")

        if user_key is None:
            try:
                dmarc_entry = db.collection("dmarc").insert(dmarc)
                spf_entry = db.collection("spf").insert(spf)
                dkim_entry = db.collection("dkim").insert(dkim)

                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsDMARC").insert(
                    {
                        "_from": domain["_id"],
                        "_to": dmarc_entry["_id"],
                    }
                )
                db.collection("domainsSPF").insert(
                    {"_from": domain["_id"],
                     "_to": spf_entry["_id"]}
                )
                db.collection("domainsDKIM").insert(
                    {
                        "_from": domain["_id"],
                        "_to": dkim_entry["_id"],
                    }
                )

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

                domain.update({"phase": dmarc.get("results").get("phase")})
                db.collection("domains").update(domain)

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
