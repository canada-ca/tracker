import logging
import os
import json
from datetime import datetime
from arango import ArangoClient

from dotenv import load_dotenv
import asyncio
import nats
from nats.js.api import RetentionPolicy

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

from clients.kusto_client import (
    get_labelled_org_assets_from_org_key,
    get_unlabelled_assets,
)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

NATS_URL = os.getenv("NATS_URL")
UNCLAIMED_ID = os.getenv("UNCLAIMED_ID")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


async def main():
    logger.info("Connecting to NATS")
    nc = await nats.connect(NATS_URL)
    logger.info("Successfully connected to NATS")

    js = nc.jetstream()
    add_stream_options = {
        "name": "SCANS",
        "subjects": [
            "scans.requests",
            "scans.discovery",
            "scans.add_domain_to_easm",
            "scans.dns_scanner_results",
            "scans.dns_processor_results",
            "scans.web_scanner_results",
            "scans.web_processor_results",
        ],
        "retention": RetentionPolicy.WORK_QUEUE,
    }

    await js.add_stream(**add_stream_options)

    async def publish(channel, msg):
        await js.publish(channel, msg)

    # queries
    def get_verified_orgs():
        query = """
        FOR org IN organizations
            FILTER org.verified == true
            RETURN { "key": org._key, "id": org._id }
        """
        try:
            cursor = db.aql.execute(query)
            logger.info(f"Successfully fetched verified orgs")
            return [domain for domain in cursor]
        except Exception as e:
            logger.error(f"Error occurred when fetching verified orgs: {e}")
            return []

    def get_org_domains(org_id):
        query = f"""
        FOR v, e IN 1..1 OUTBOUND @org_id claims
            RETURN v.domain
        """
        cursor = db.aql.execute(query, bind_vars={"org_id": org_id})
        logger.info(f"Successfully fetched domains for org: {org_id}")
        return [domain for domain in cursor]

    def get_domain_exists(domain):
        query = """
        FOR domain IN domains
            FILTER domain.domain == @domain
            RETURN domain
        """
        bind_vars = {"domain": domain}
        try:
            cursor = db.aql.execute(query, bind_vars=bind_vars)
            domains = [domain for domain in cursor]
            return len(domains) > 0
        except Exception as e:
            logger.error(f"Error occured when checking if domain exists: {e}")
            return None

    # insert functions
    async def create_domain(domain: str, txn_col):
        insert_domain = {
            "domain": domain.lower(),
            "lastRan": None,
            "status": {
                "certificates": "info",
                "ciphers": "info",
                "curves": "info",
                "dkim": "info",
                "dmarc": "info",
                "hsts": "info",
                "https": "info",
                "protocols": "info",
                "spf": "info",
                "ssl": "info",
            },
            "archived": False,
            "ignoreRua": False,
        }

        try:
            created_domain = txn_col.insert(insert_domain)
            logger.info(f"Successfully created domain: {domain}")
            return created_domain
        except Exception as e:
            logger.error(f"Error occured when creating domain: {e}")
            return None

    def create_claim(org_id, domain_id, domain_name, txn_col):
        insert_claim = {
            "_from": org_id,
            "_to": domain_id,
            "tags": [{"en": "NEW", "fr": "NOUVEAU"}],
            "firstSeen": datetime.today().isoformat(),
        }

        try:
            created_claim = txn_col.insert(insert_claim)
            logger.info(f"Successfully created claim for domain: {domain_name}")
            return created_claim
        except Exception as e:
            logger.error(f"Error occured when creating claim for {domain_name}", e)
            return None

    def log_activity(domain, org_key, txn_col):
        insert_activity = {
            "timestamp": datetime.today().isoformat(),
            "initiatedBy": {
                "id": "easm",
                "userName": "automated-discovery-service",
                "role": "service",
            },
            "target": {
                "resource": domain,
                "updatedProperties": [
                    {
                        "name": "tags",
                        "oldValue": [],
                        "newValue": [{"en": "NEW", "fr": "NOUVEAU"}],
                    }
                ],
                "organization": {"id": org_key},
                "resourceType": "domain",
            },
            "action": "add",
            "reason": None,
        }

        try:
            created_log = txn_col.insert(insert_activity)
            logger.info(f"Successfully logged activity for domain: {domain}")
            return created_log
        except Exception as e:
            logger.error(f"Error occured when logging activity for {domain}: {e}")
            return None

    # main logic
    async def add_discovered_domain(domains, org_id):
        for domain in domains:
            # check if domain exists in system
            domain_exists = get_domain_exists(domain)
            if domain_exists is None:
                continue
            # if domain exists, skip
            elif domain_exists:
                logger.info(f"Domain: {domain} already exists in system")
                continue

            # setup transaction
            txn_db = db.begin_transaction(
                write=[
                    db.collection("domains").name,
                    db.collection("claims").name,
                    db.collection("auditLogs").name,
                ],
            )
            txn_col_domains = txn_db.collection("domains")
            txn_col_claims = txn_db.collection("claims")
            txn_col_audit_logs = txn_db.collection("auditLogs")

            # create domain
            created_domain = await create_domain(domain=domain, txn_col=txn_col_domains)
            if created_domain is None:
                # abort transaction
                txn_db.abort_transaction()
                continue
            # add domain to org
            created_claim = await create_claim(
                org_id=org_id,
                domain_id=created_domain["_id"],
                domain_name=domain,
                txn_col=txn_col_claims,
            )
            if created_claim is None:
                # abort transaction
                txn_db.abort_transaction()
                continue
            # add activity logging
            org_key = org_id.split("/")[-1]
            created_log = await log_activity(
                domain=domain, org_key=org_key, txn_col=txn_col_audit_logs
            )
            if created_log is None:
                # abort transaction
                txn_db.abort_transaction()
                continue

            # commit transaction
            try:
                txn_db.commit_transaction()
                logger.info(f"Successfully committed transaction for domain: {domain}")

                # publish domain to NATS
                try:
                    await publish(
                        "scans.requests",
                        json.dumps(
                            {
                                "domain": domain,
                                "domain_key": created_domain["_key"],
                            }
                        ).encode(),
                    )
                    logger.info(f"Published domain: {domain} to NATS")
                except Exception as e:
                    logger.error(f"Failed to publish domain: {domain} to NATS: {e}")

            except Exception as e:
                logger.error(f"Failed to commit transaction for domain: {domain}: {e}")
                # abort transaction
                txn_db.abort_transaction()
                continue

    verified_orgs = get_verified_orgs()
    for org in verified_orgs:
        org_key = org["key"]
        org_id = org["id"]

        try:
            domains = get_org_domains(org_id)
        except Exception as e:
            logger.error(
                f"Error when attempting to fetch domains for org {org_key}: {e}"
            )
            continue

        try:
            labelled_assets = get_labelled_org_assets_from_org_key(org_key)
            new_domains = list(set(labelled_assets) - set(domains))
            await add_discovered_domain(new_domains, org_id)
        except Exception as e:
            logger.error(
                f"Error when attempting to add new assets to org {org_key}: {e}"
            )
            continue

    try:
        unlabelled_assets = get_unlabelled_assets()
        domains = get_org_domains(org_id)
        new_domains = list(set(unlabelled_assets) - set(domains))
        await add_discovered_domain(new_domains, UNCLAIMED_ID)
    except Exception as e:
        logger.error(f"Error when attempting to add new assets to unclaimed org: {e}")

    logger.info("Closing NATS connection")
    await nc.close()
    logger.info("Successfully closed connection")


if __name__ == "__main__":
    logger.info("Starting EASM-to-Tracker sync")
    asyncio.run(main())
    logger.info(f"EASM-to-Tracker sync shutting down...")
