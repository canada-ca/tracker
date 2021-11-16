import json
import argparse, sys
import asyncio
import os
import signal
import datetime
import traceback
import logging
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from arango import ArangoClient
from nats.aio.client import Client as NATS

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

current_directory = os.path.dirname(os.path.realpath(__file__))
# Opening JSON file from:
# https://raw.githubusercontent.com/CybercentreCanada/ITSP.40.062/main/transport-layer-security/tls-guidance.json
guidance_file = open(f"{current_directory}/tls-guidance.json")
guidance = json.load(guidance_file)

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)

import inspect


def line_number():
    return inspect.currentframe().f_back.f_lineno


def publish_results(results, scan_type, user_key):
    print(json.dumps(results, indent=2))


def process_results(results, domain_key, user_key, shared_id):
    timestamp = str(datetime.datetime.utcnow())
    neutral_tags = []
    positive_tags = []
    negative_tags = []
    strong_ciphers = []
    acceptable_ciphers = []
    weak_ciphers = []
    strong_curves = []
    acceptable_curves = []
    weak_curves = []

    if results.get("error") == "unreachable":
        neutral_tags.append("ssl9")
    else:
        for cipher in results["cipher_list"]:
            if "RC4" in cipher:
                negative_tags.append("ssl3")
            if "3DES" in cipher:
                negative_tags.append("ssl4")
            if cipher in (
                guidance["ciphers"]["1.2"]["recommended"]
                + guidance["ciphers"]["1.3"]["recommended"]
            ):
                strong_ciphers.append(cipher)
            elif cipher in (
                guidance["ciphers"]["1.2"]["sufficient"]
                + guidance["ciphers"]["1.3"]["sufficient"]
            ):
                acceptable_ciphers.append(cipher)
            else:
                weak_ciphers.append(cipher)

        for curve in results["supported_curves"]:
            if curve.lower() in guidance["curves"]["recommended"]:
                strong_curves.append(curve)
            elif curve.lower() in guidance["curves"]["sufficient"]:
                acceptable_curves.append(curve)
            else:
                weak_curves.append(curve)

        if results.get("signature_algorithm", None) is not None:
            for algorithm in (
                guidance["signature_algorithms"]["recommended"]
                + guidance["signature_algorithms"]["sufficient"]
            ):
                if results["signature_algorithm"].lower() in algorithm:
                    positive_tags.append("ssl5")
                    break

        if len(weak_ciphers) > 0:
            negative_tags.append("ssl6")

        if len(weak_curves) > 0:
            negative_tags.append("ssl10")

        if results["heartbleed"]:
            negative_tags.append("ssl7")

        if results["openssl_ccs_injection"]:
            negative_tags.append("ssl8")

    sslResults = {
        "timestamp": timestamp,
        "strong_ciphers": strong_ciphers,
        "acceptable_ciphers": acceptable_ciphers,
        "weak_ciphers": weak_ciphers,
        "strong_curves": strong_curves,
        "acceptable_curves": acceptable_curves,
        "weak_curves": weak_curves,
        "supports_ecdh_key_exchange": results.get("supports_ecdh_key_exchange", False),
        "heartbleed_vulnerable": results.get("heartbleed", False),
        "ccs_injection_vulnerable": results.get("openssl_ccs_injection", False),
        "rawJson": results,
        "neutralTags": neutral_tags,
        "positiveTags": positive_tags,
        "negativeTags": negative_tags,
    }

    cipher_tags = ["ssl6"]

    if results.get("error") == "unreachable":
        # no web, no problem.
        ssl_status = "info"
        protocol_status = "info"
        cipher_status = "info"
        curve_status = "info"
    else:
        # ssl status
        if len(negative_tags) > 0 or "ssl5" not in positive_tags:
            ssl_status = "fail"
        else:
            ssl_status = "pass"

        # protocol status
        if (len([tag for tag in negative_tags if tag not in cipher_tags]) > 0 or "ssl5" not in positive_tags):
            protocol_status = "fail"
        else:
            protocol_status = "pass"

        # get cipher status
        cipher_status = "fail" if len(weak_ciphers) > 0 else "pass"

        # get curve status
        curve_status = "fail" if len(weak_curves) > 0 else "pass"

    if user_key is None:
        try:
            sslEntry = db.collection("ssl").insert(sslResults)
            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsSSL").insert(
                {"_from": domain["_id"], "_to": sslEntry["_id"]}
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
            # printing criteria and judgement so we can easily look at logs for debugging.
            print(json.dumps({"line": line_number(), "criteria": {"domain": domain["domain"],
                "weak_curves": weak_curves,"strong_curves": strong_curves,
                "acceptable_curves": acceptable_curves, "weak_ciphers":
                weak_ciphers,  "strong_ciphers": strong_ciphers,
                "acceptable_ciphers": acceptable_ciphers , "neutral_tags":
                neutral_tags, "positive_tags": positive_tags, "negative_tags": negative_tags},
                "judgement": {"cipher_status": cipher_status, "curve_status":
                    curve_status, "ssl_status": ssl_status, "protocol_status":
                    protocol_status}, "saved_result": {"domain": domain }}, indent=2))

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
            "results": sslResults,
        }

    else:
        publish_results(
            {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": ssl_status,
                "results": sslResults,
            },
            "ssl",
            user_key,
        )


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

        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor()
        processed = await loop.run_in_executor(
            executor, lambda: process_results(results, domain_key, user_key, shared_id)
        )
        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.tls.processed", json.dumps(processed).encode()
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
        print(f"Nats error callback: {e}")

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
    load_dotenv()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()
        guidance_file.close()


if __name__ == "__main__":
    main()
