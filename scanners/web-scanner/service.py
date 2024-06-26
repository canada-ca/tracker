import functools
import json
import logging
import asyncio
import os
import signal
import sys

from dotenv import load_dotenv
from concurrent.futures import TimeoutError, ProcessPoolExecutor
from scan.web_scanner import scan_web
import nats

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s')
logger = logging.getLogger()

NAME = os.getenv("NAME", "web-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.web")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "web-scanner")
SERVER_LIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVER_LIST.split(",")


def scan_web_and_catch(domain, ip_address):
    try:
        return scan_web(domain=domain, ip_address=ip_address)
    except Exception as e:
        logger.error(f"Error scanning '{domain}' at IP address '{ip_address}': {str(e)}")


def process_results(results):
    # report = {}
    #
    # if results == {}:
    #     report = {"error": "unreachable"}
    # else:
    #     for version in [
    #         "SSL_2_0",
    #         "SSL_3_0",
    #         "TLS_1_0",
    #         "TLS_1_1",
    #         "TLS_1_2",
    #         "TLS_1_3",
    #     ]:
    #         if version in results["TLS"]["supported"]:
    #             report[version] = True
    #         else:
    #             report[version] = False
    #
    #     report["cipher_list"] = results["TLS"]["accepted_cipher_list"]
    #     report["signature_algorithm"] = results.get("signature_algorithm", "unknown")
    #     report["heartbleed"] = results.get("is_vulnerable_to_heartbleed", False)
    #     report["openssl_ccs_injection"] = results.get(
    #         "is_vulnerable_to_ccs_injection", False
    #     )
    #     report["supports_ecdh_key_exchange"] = results.get(
    #         "supports_ecdh_key_exchange", False
    #     )
    #     report["supported_curves"] = results.get("supported_curves", [])

    return results


async def scan_service():
    loop = asyncio.get_running_loop()

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
        domain_key = payload.get("domain_key")
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")
        ip_address = payload.get("ip_address")
        web_scan_key = payload.get("web_scan_key")

        try:
            logger.info(f"Starting web scan on '{domain}' at IP address '{ip_address}'")
            with ProcessPoolExecutor(max_workers=1) as executor:
                scan_results = await loop.run_in_executor(
                    executor, functools.partial(scan_web_and_catch, domain=domain, ip_address=ip_address)
                )

        except TimeoutError:
            scan_results = {"results": {"error": "unreachable"}}

        processed_results = process_results(scan_results)

        logger.info(f"Web results for '{domain}' at IP address '{str(ip_address)}': {json.dumps(processed_results)}")

        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.web.results",
            json.dumps(
                {
                    "results": processed_results,
                    "scan_type": "web",
                    "user_key": user_key,
                    "domain": domain,
                    "domain_key": domain_key,
                    "shared_id": shared_id,
                    "ip_address": ip_address,
                    "web_scan_key": web_scan_key
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

    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(scan_service())
