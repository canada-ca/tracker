import functools
import json
import sys
import logging
import asyncio
import os
import signal

from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from dns_scanner.dns_scanner import scan_domain
import nats

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s')
logger = logging.getLogger()

NAME = os.getenv("NAME", "dns-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "dns-scanner")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")


def to_json(msg):
    print(json.dumps(msg, indent=2))


async def run(loop):
    async def error_cb(error):
        logger.error(f"MY ERROR: {error}")

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
        logger.info(
            "Received a message on '{subject} {reply}': {data}".format(
                subject=subject, reply=reply, data=data
            )
        )
        payload = json.loads(msg.data)

        domain = payload.get("domain")
        domain_key = payload.get("domain_key")
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")
        selectors = payload.get("selectors")

        try:
            logger.info(f"Starting DNS scan on '{domain}' with DKIM selectors '{str(selectors)}'")
            scan_results = scan_domain(domain=domain, dkim_selectors=selectors)

            await nc.publish(
                f"{PUBLISH_TO}.{domain_key}.dns",
                json.dumps(
                    {
                        "results": scan_results,
                        "domain": domain,
                        "scan_type": "dns",
                        "user_key": user_key,
                        "domain_key": domain_key,
                        "shared_id": shared_id,
                    }
                ).encode(),
            )
        except TimeoutError:
            logger.error(
                f"Timeout while scanning {domain} with DKIM selectors '{str(selectors)}'"
            )
            await nc.publish(
                f"{PUBLISH_TO}.{domain_key}.dns",
                json.dumps(
                    {
                        "results": {
                            "dmarc": {"error": "missing"},
                            "spf": {"error": "missing"},
                            "mx": {"error": "missing"},
                            "dkim": {"error": "missing"},
                        },
                        "domain": domain,
                        "user_key": user_key,
                        "domain_key": domain_key,
                        "shared_id": shared_id,
                    }
                ).encode(),
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

    await nc.subscribe(SUBSCRIBE_TO, QUEUE_GROUP, subscribe_handler)


def main():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    main()
