import logging
import os
from dataclasses import dataclass

from dotenv import load_dotenv

import asyncio
import nats
import json
import signal

from nats.errors import TimeoutError as NatsTimeoutError
from nats.js import JetStreamContext
from nats.js.api import RetentionPolicy, ConsumerConfig, AckPolicy

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

from clients.easm_client import run_disco_group, create_disco_group
from clients.kusto_client import get_host_asset

NAME = os.getenv("NAME", "add-domain-to-easm")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")


async def run():
    loop = asyncio.get_running_loop()

    @dataclass
    class Context:
        should_exit: bool = False
        sub: JetStreamContext.PullSubscription = None

    context = Context()

    async def error_cb(error):
        logger.error(f"Uncaught error in callback: {error}")

    async def reconnected_cb():
        logger.info(f"Reconnected to NATS at {nc.connected_url.netloc}...")
        # Ensure jetstream stream and consumer are still present
        await js.add_stream(**add_stream_options)
        context.sub = await js.pull_subscribe(**pull_subscribe_options)

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
    )

    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    add_stream_options = {
        "name": "SCANS",
        "subjects": [
            "scans.requests",
            "scans.requests_priority",
            "scans.discovery",
            "scans.add_domain_to_easm",
            "scans.dns_scanner_results",
            "scans.dns_processor_results",
            "scans.dns_processor_results_priority",
            "scans.web_scanner_results",
            "scans.web_processor_results",
        ],
        "retention": RetentionPolicy.WORK_QUEUE,
    }

    await js.add_stream(**add_stream_options)

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.add_domain_to_easm",
        "durable": "add_domain_to_easm",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)

    async def ask_exit(sig_name):
        if context.should_exit is True:
            return
        logger.error(f"Got signal {sig_name}: exit")
        context.should_exit = True

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            lambda: asyncio.create_task(ask_exit(signal_name)),
        )

    while True:
        if context.should_exit:
            break
        if nc.is_closed:
            logger.error("Connection to NATS is closed")

        try:
            logger.debug("Fetching message...")
            msgs = await context.sub.fetch(batch=1, timeout=1)
            msg = msgs[0]
        except NatsTimeoutError:
            logger.debug("No messages available...")
            continue

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


if __name__ == "__main__":
    asyncio.run(run())
