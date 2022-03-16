import json
import asyncio
import os
import signal
import traceback
from dotenv import load_dotenv
from arango import ArangoClient
from nats.aio.client import Client as NATS

from dns_processor import process_results

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)

async def run(loop):
    nc = NATS()

    async def error_cb(e):
        print(
            f"Nats error callback: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )

    async def closed_cb():
        print("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    async def reconnected_cb():
        print(f"Connected to NATS at {nc.connected_url.netloc}...")

    async def subscribe_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        print(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)
        results = payload["results"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]

        processed = process_results(results, domain_key, user_key, shared_id)

        if user_key is None:
            try:
                dmarcEntry = db.collection("dmarc").insert(dmarcResults)

                spfEntry = db.collection("spf").insert(spfResults)

                dkimEntry = db.collection("dkim").insert(
                    {"timestamp": timestamp})

                for selector in dkimResults.keys():
                    dkimResultsEntry = db.collection("dkimResults").insert(
                        dkimResults[selector]
                    )
                    db.collection("dkimToDkimResults").insert(
                        {
                            "_from": dkimEntry["_id"],
                            # Add timestamps to edges so that traversals can be
                            # constrained by time.
                            "timestamp": timestamp,
                            "_to": dkimResultsEntry["_id"],
                        }
                    )

                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsDMARC").insert(
                    {
                        "_from": domain["_id"],
                        "timestamp": timestamp,
                        "_to": dmarcEntry["_id"],
                    }
                )
                db.collection("domainsSPF").insert(
                    {"_from": domain["_id"], "timestamp": timestamp,
                     "_to": spfEntry["_id"]}
                )
                db.collection("domainsDKIM").insert(
                    {
                        "_from": domain["_id"],
                        "timestamp": timestamp,
                        "_to": dkimEntry["_id"],
                    }
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

                for key, val in {
                    "dkim": dkim_status,
                    "dmarc": dmarc_status,
                    "spf": spf_status,
                }.items():
                    domain["status"][key] = val

                domain.update({"phase": phase})
                db.collection("domains").update(domain)

            except Exception as e:
                logging.error(
                    f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

            logging.info("DNS Scans inserted into database")

        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.dns.processed", json.dumps(processed).encode()
        )

    try:
        await nc.connect(
            loop=loop,
            error_cb=error_cb,
            closed_cb=closed_cb,
            reconnected_cb=reconnected_cb,
            servers=SERVERS,
        )
    except Exception as e:
        print(f"Error connecting to Nats: {e}")

    print(f"Connected to NATS at {nc.connected_url.netloc}...")

    def signal_handler():
        if nc.is_closed:
            return
        print("Disconnecting...")
        loop.create_task(nc.close())

    for sig in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, sig), signal_handler)

    await nc.subscribe(SUBSCRIBE_TO, QUEUE_GROUP, subscribe_handler)


def main():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()
