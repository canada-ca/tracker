import subprocess
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone

from arango import ArangoClient
from dotenv import load_dotenv

import asyncio
import nats
import json
import signal
import traceback

import dns.resolver
from nats.js import JetStreamContext
from nats.js.api import ConsumerConfig, AckPolicy
from nats.errors import TimeoutError

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

NAME = os.getenv("NAME", "domain-discovery")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def process_subdomains(results, orgId):
    subdomains = [domain.strip() for domain in results]
    claimed_domains = get_claimed_domains(orgId)
    domains_to_scan = []
    for subdomain in subdomains:
        if (
            subdomain not in claimed_domains
            and subdomain.strip()
            and check_live(subdomain)
        ):
            logger.info(
                "Adding {subdomain} to org: {orgId}".format(
                    subdomain=subdomain, orgId=orgId
                )
            )
            try:
                checkDomain = (
                    db.collection("domains").find({"domain": subdomain}).next()
                )
            except StopIteration:
                checkDomain = None
            if not checkDomain:
                try:
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
                except Exception as e:
                    logger.error(
                        f"Inserting new domain: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                    )
                    continue
            else:
                domainInsert = checkDomain

            try:
                db.collection("claims").insert(
                    {
                        "_from": orgId,
                        "_to": domainInsert["_id"],
                        "tags": ['new-nouveau'],
                        "assetState": "approved",
                        "firstSeen": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[
                :-3
            ]
            + "Z",
                    }
                )
            except Exception as e:
                logger.error(
                    f"Claiming domain: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                continue
    return domains_to_scan


def get_claimed_domains(orgId):
    # Get existing domains in org
    try:
        cursor = db.aql.execute(
            "FOR v, e IN 1..1 OUTBOUND @val claims RETURN v.domain",
            bind_vars={"val": orgId},
            count=True,
        )
        return [document for document in cursor]
    except Exception as e:
        logger.error(
            f"Getting claimed domains: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return []


def check_live(domain):
    try:
        dns.resolver.resolve(domain, rdtype=dns.rdatatype.A, raise_on_no_answer=False)
        return True
    except (
        dns.resolver.NoAnswer,
        dns.resolver.NXDOMAIN,
        dns.resolver.NoNameservers,
        dns.exception.Timeout,
        dns.name.EmptyLabel,
        dns.name.LabelTooLong,
    ):
        return False
    except Exception:
        return False


def domain_discovery(domain, orgId):
    try:
        findomain_output = subprocess.run(
            [
                "findomain",
                "-t",
                domain,
                "-q",
            ],
            capture_output=True,
            text=True,
        )
        subdomain_list = findomain_output.stdout.split("\n")
    except Exception as e:
        logger.error(
            f"Running findomain: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return []

    results = process_subdomains(subdomain_list, orgId)
    return results


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
        # Ensure jetstream consumer is still present
        context.sub = await js.pull_subscribe(**pull_subscribe_options)
        logger.info("Re-subscribed to NATS...")

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
    )

    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.discovery",
        "durable": "domain_discovery",
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
        except nats.errors.TimeoutError:
            logger.debug("No messages available...")
            continue

        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        logger.info(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)

        domain = payload.get("domain")
        org_id = payload.get("orgId")

        logger.info(f"Starting subdomain scan on '{domain}'")
        results = domain_discovery(domain, org_id)
        logger.info(f"{len(results)} new subdomains found for {domain}")

        for newDomain in results:
            domain_key = newDomain["_key"]
            try:
                await js.publish(
                    stream="SCANS",
                    subject="scans.requests",
                    payload=json.dumps(
                        {
                            "domain": newDomain["domain"],
                            "selectors": [],
                            "domain_key": domain_key,
                        }
                    ).encode(),
                )

            except Exception as e:
                logger.error(
                    f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return


if __name__ == "__main__":
    asyncio.run(run())
