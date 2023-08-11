import subprocess
import logging
import os
from arango import ArangoClient
from dotenv import load_dotenv

import asyncio
import nats
import functools
import json
import signal
import traceback

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

NAME = os.getenv("NAME", "domain-discovery")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*.discovery")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "domain-discovery")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def process_subdomains(base_domain, orgId):
    f = open("{domain}.txt".format(domain=base_domain), "r")
    subdomains = f.readlines()
    subdomains = [domain.strip() for domain in subdomains]
    claimed_domains = get_claimed_domains(orgId)
    domains_to_scan = []
    for subdomain in subdomains:
        if subdomain not in claimed_domains:
            logging.info("Adding {subdomain} to DB".format(subdomain=subdomain))
            try:
                checkDomain = (
                    db.collection("domains").find({"domain": subdomain}).next()
                )
            except StopIteration:
                checkDomain = None
            if not checkDomain:
                domainInsert = db.collection("domains").insert(
                    {
                        "domain": subdomain,
                        "lastRan": None,
                        "selectors": [],
                        "hash": None,
                        "status": {
                            "certificates": None,
                            "dkim": None,
                            "dmarc": None,
                            "https": None,
                            "spf": None,
                            "ssl": None,
                        },
                        "archived": False,
                    }
                )
                domainInsert["domain"] = subdomain
                domains_to_scan.append(domainInsert)
            else:
                domainInsert = checkDomain
            db.collection("claims").insert(
                {
                    "_from": orgId,
                    "_to": domainInsert["_id"],
                    "hidden": False,
                    "tags": [{"en": "NEW", "fr": "NOUVEAU"}],
                }
            )
    return domains_to_scan


def get_claimed_domains(orgId):
    # Get existing domains in org
    cursor = db.aql.execute(
        "FOR v, e IN 1..1 OUTBOUND @val claims RETURN v.domain",
        bind_vars={"val": orgId},
        count=True,
    )
    return [document for document in cursor]


def domain_discovery(domain, orgId):
    try:
        os.mkdir("domains")
        os.chdir("domains")
    except FileExistsError:
        os.chdir("domains")

    subprocess.run(["findomain", "-t", domain, "-o", "-q"])
    results = process_subdomains(domain, orgId)
    os.remove("{domain}.txt".format(domain=domain))
    os.chdir("..")
    return results


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
        orgId = payload.get("orgId")

        try:
            logger.info(f"Starting subdomain scan on '{domain}'")
            results = domain_discovery(domain, orgId)

            logging.info(f"{len(results)} new subdomains found for {domain}")

            for newDomain in results:
                domain_key = newDomain["_key"]
                try:
                    await nc.publish(
                        f"{PUBLISH_TO}.{domain_key}",
                        json.dumps(
                            {
                                "domain": newDomain["domain"],
                                "selectors": [],
                                "domain_key": domain_key,
                            }
                        ).encode(),
                    )

                except Exception as e:
                    logging.error(
                        f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                    )
                    return
        except Exception as e:
            logging.error(
                f"Scanning subdomains: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            try:
                os.remove("{domain}.txt".format(domain=domain))
                os.chdir("..")
            except FileNotFoundError:
                pass
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
