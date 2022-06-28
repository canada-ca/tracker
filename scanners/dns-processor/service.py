import functools
import json
import asyncio
import os
import signal
import logging
from dotenv import load_dotenv
from arango import ArangoClient
import nats

from dns_processor import process_results

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
        shared_id = payload.get("shared_id")

        # processed = process_results(results, domain_key, user_key, shared_id)

        # if user_key is None:
        #     try:
        #         dmarcEntry = db.collection("dmarc").insert(dmarcResults)
        #
        #         spfEntry = db.collection("spf").insert(spfResults)
        #
        #         dkimEntry = db.collection("dkim").insert(
        #             {"timestamp": timestamp})
        #
        #         for selector in dkimResults.keys():
        #             dkimResultsEntry = db.collection("dkimResults").insert(
        #                 dkimResults[selector]
        #             )
        #             db.collection("dkimToDkimResults").insert(
        #                 {
        #                     "_from": dkimEntry["_id"],
        #                     # Add timestamps to edges so that traversals can be
        #                     # constrained by time.
        #                     "timestamp": timestamp,
        #                     "_to": dkimResultsEntry["_id"],
        #                 }
        #             )
        #
        #         domain = db.collection("domains").get({"_key": domain_key})
        #         db.collection("domainsDMARC").insert(
        #             {
        #                 "_from": domain["_id"],
        #                 "timestamp": timestamp,
        #                 "_to": dmarcEntry["_id"],
        #             }
        #         )
        #         db.collection("domainsSPF").insert(
        #             {"_from": domain["_id"], "timestamp": timestamp,
        #              "_to": spfEntry["_id"]}
        #         )
        #         db.collection("domainsDKIM").insert(
        #             {
        #                 "_from": domain["_id"],
        #                 "timestamp": timestamp,
        #                 "_to": dkimEntry["_id"],
        #             }
        #         )
        #
        #         if domain.get("status", None) == None:
        #             domain.update(
        #                 {
        #                     "status": {
        #                         "https": "unknown",
        #                         "ssl": "unknown",
        #                         "dmarc": "unknown",
        #                         "dkim": "unknown",
        #                         "spf": "unknown",
        #                         "certificates": "fail",
        #                         "ciphers": "fail",
        #                         "curves": "fail",
        #                         "hsts": "fail",
        #                         "policy": "fail",
        #                         "protocols": "fail",
        #                     }
        #                 }
        #             )
        #
        #         for key, val in {
        #             "dkim": dkim_status,
        #             "dmarc": dmarc_status,
        #             "spf": spf_status,
        #         }.items():
        #             domain["status"][key] = val
        #
        #         domain.update({"phase": phase})
        #         db.collection("domains").update(domain)
        #
        #     except Exception as e:
        #         logging.error(
        #             f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        #         )
        #         return
        #
        #     logging.info("DNS Scans inserted into database")

        # await nc.publish(
        #     f"{PUBLISH_TO}.{domain_key}.dns.processed", json.dumps(processed).encode()
        # )

        for ip in results.get("resolve_ips"):
            await nc.publish(
                f"{PUBLISH_TO}.{domain_key}.web",
                json.dumps({
                    "domain": results.get("domain"),
                    "domain_key": domain_key,
                    "ip_address": ip
                }).encode()
            )

        # await nc.publish(
        #     f"{PUBLISH_TO}.{domain_key}.dns.processed", json.dumps(processed).encode()
        # )

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
