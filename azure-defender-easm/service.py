import logging
import os
from dotenv import load_dotenv

import asyncio
import nats
import functools
import json
import signal
import traceback

from scripts.discover_assets import (
    run_disco_group,
    create_disco_group,
    delete_disco_group,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

NAME = os.getenv("NAME", "azure-defender-easm")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "azure-defender-easm")
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

        try:
            logger.info(f"Adding '{domain}' to EASM tooling...")
            await create_disco_group(domain, [domain])
            await run_disco_group(domain)
            await delete_disco_group(domain)
            logger.info(f"Successfully added '{domain}' to EASM tooling.")

        except Exception as e:
            logging.error(
                f"Scanning subdomains: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
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
    main()
