import logging
import os
from dotenv import load_dotenv

import asyncio
import nats
import functools
import json
import signal

from clients.easm_client import run_disco_group, create_disco_group
from clients.kusto_client import get_host_asset

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

NAME = os.getenv("NAME", "add-domain-to-easm")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.easm")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "add-domain-to-easm")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")


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
        await asyncio.sleep(0.01)
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        logger.info(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)

        domain = payload.get("domain")
        if not domain.endswith(".gc.ca") and not domain.endswith(".canada.ca"):
            logger.info(f"Skipping '{domain}' as it is not a GC domain.")
            return

        try:
            easm_asset = get_host_asset(domain)
            if len(easm_asset) > 0:
                logger.info(f"Skipping '{domain}' as it already exists in EASM.")
                return
        except Exception as e:
            logger.error(f"Checking if asset exists in EASM: {str(e)}")
            return

        try:
            logger.info(f"Adding '{domain}' to EASM tooling...")
            create_disco_group(name=domain, assets=[{"kind": "host", "name": domain}])
            run_disco_group(domain)
            logger.info(f"Successfully added '{domain}' to EASM tooling.")
        except Exception as e:
            logger.error(f"Scanning subdomains: {str(e)}")
            return

    await nc.subscribe(subject=SUBSCRIBE_TO, queue=QUEUE_GROUP, cb=subscribe_handler)

    def ask_exit(sig_name):
        logger.error(f"Got signal {sig_name}: exit")
        if nc.is_closed:
            return
        loop.create_task(nc.close())

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name), functools.partial(ask_exit, signal_name)
        )


def main():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    # main()
    print(get_host_asset("cyber.gc.ca"))
