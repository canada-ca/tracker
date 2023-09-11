import functools
import json
import sys
import logging
import asyncio
import os
import signal

from arango import ArangoClient
from dotenv import load_dotenv
from concurrent.futures import TimeoutError
from dns_scanner.dns_scanner import scan_domain
import nats

from dns_scanner.email_scanners import check_if_domain_exists

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s')
logger = logging.getLogger()

NAME = os.getenv("NAME", "dns-scanner")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO", "domains.*")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
QUEUE_GROUP = os.getenv("QUEUE_GROUP", "dns-scanner")
SERVERLIST = os.getenv("NATS_SERVERS", "nats://localhost:4222")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def to_json(msg):
    print(json.dumps(msg, indent=2))


async def run():
    loop = asyncio.get_running_loop()

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
        await asyncio.sleep(0.01)
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
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")

        # Check if domain exists in DB
        domain_doc_cursor = db.collection("domains").find({"domain": domain}, limit=1)

        try:
            domain_doc = [doc for doc in domain_doc_cursor][0]
        except IndexError:
            logger.error(f"Domain '{domain}' not found in DB")
            return

        domain_key = domain_doc.get("_key")
        domain_id = domain_doc.get("_id")

        # Get DKIM selectors from DB
        try:
            selectors_cursor = db.aql.execute(
                """
                FOR selector, e IN 1 ANY @domain domainsToSelectors
                    RETURN selector.selector
                """,
                bind_vars={"domain": domain_id},
            )
            selectors = [sel for sel in selectors_cursor]
            active_selectors = [sel for sel in selectors_cursor if sel.status == "active"]
        except Exception as e:
            logger.error(f"Error getting selectors for domain '{domain}': {e}")
            return

        # Get DKIM selectors from DMARC summaries in DB
        try:
            summary_selectors_cursor = db.aql.execute(
                """
                LET selsSplit = (
                    FOR dmarcSumm, e IN 1 ANY @domain domainsToDmarcSummaries
                        LIMIT 1
                        LET sels = (
                            FOR s in dmarcSumm.detailTables.fullPass[*].dkimSelectors
                                RETURN SPLIT(s, ",")
                        )
                        RETURN sels
                )[***]

                FOR sel IN selsSplit
                    RETURN DISTINCT sel
                """,
                bind_vars={"domain": domain_id},
            )
        except Exception as e:
            logger.error(f"Error getting selectors from DMARC summaries for domain '{domain}': {e}")
            return
        summary_selectors = [sel for sel in summary_selectors_cursor]

        for selector in summary_selectors:
            if selector not in selectors and selector != "":
                if not check_if_domain_exists(f"{selector}._domainkey.{domain}"):
                    continue

                # Insert new domain/selector connection into DB
                try:
                    db.aql.execute(
                        """
                        // First ensure selector exists
                        LET selector = (
                            UPSERT { selector: @selector }
                                INSERT { selector: @selector }
                                UPDATE { }
                                IN selectors
                            RETURN NEW
                        )[0]

                        // Create domain/selector connection
                        UPSERT { _from: @domain, _to: selector._id }
                            INSERT { _from: @domain, _to: selector._id, status: "active" }
                            UPDATE { }
                            IN domainsToSelectors
                        """,
                        bind_vars={"domain": domain_id, "selector": selector}
                    )
                except Exception as e:
                    logger.error(f"Error inserting new domain/selector connection for domain '{domain}' and selector '{selector}': {e}")
                    return

                logger.info(f"Inserted new domain/selector connection for domain '{domain}' and selector '{selector}'")
                active_selectors.append(selector)

        try:
            logger.info(f"Starting DNS scan on '{domain}' with DKIM selectors '{str(active_selectors)}'")
            scan_results = scan_domain(domain=domain, dkim_selectors=active_selectors)

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
                f"Timeout while scanning {domain} with DKIM selectors '{str(active_selectors)}'"
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

    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(run())
