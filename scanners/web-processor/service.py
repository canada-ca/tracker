import functools
import json
import logging
import asyncio
import os
import signal
from arango import ArangoClient
from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from web_processor.web_processor import process_results
import nats

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

NAME = os.getenv("NAME", "web_processor")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.web")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "web_processor")
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

        logger.info(f"Starting web scan processing on '{domain}' at IP address '{ip_address}'")

        processed_results = process_results(results)



        if user_key is None:
            try:
                sslEntry = db.collection("ssl").insert(ssl_results)
                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsSSL").insert(
                    {"_from": domain["_id"], "timestamp": timestamp, "_to": sslEntry["_id"]}
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

                domain["status"]["ssl"] = ssl_status
                domain["status"]["protocols"] = protocol_status
                domain["status"]["ciphers"] = cipher_status
                domain["status"]["curves"] = curve_status
                db.collection("domains").update(domain)

            except Exception as e:
                logging.error(
                    f"TLS processor: database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

            return {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": ssl_status,
                "results": ssl_results,
            }

        else:
            publish_results(
                {
                    "sharedId": shared_id,
                    "domainKey": domain_key,
                    "status": ssl_status,
                    "results": ssl_results,
                },
                "ssl",
                user_key,
            )

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
