import logging
import os
import json
from datetime import date
from arango import ArangoClient
from clients.kusto_client import (
    get_labelled_org_assets_from_org_key,
    get_unlabelled_assets,
)
from dotenv import load_dotenv
import asyncio
import nats

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

NATS_URL = os.getenv("NATS_URL")
PUBLISH_TO = os.getenv("PUBLISH_TO", "domains")
UNCLAIMED_ID = os.getenv("UNCLAIMED_ID")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)
read_cols = [db.collection("domains").name]
write_cols = [
    db.collection("domains").name,
    db.collection("claims").name,
    db.collection("auditLogs").name,
]


async def main():
    # Connect to NATS
    logging.info("Connecting to NATS")
    nc = await nats.connect(NATS_URL)
    logging.info("Successfully connected to NATS")
    # Create JetStream context.
    js = nc.jetstream()

    # Persist messages on 'foo's subject.
    await js.add_stream(name="domains", subjects=[f"{PUBLISH_TO}.*"])

    async def publish(channel, msg):
        await js.publish(channel, msg)

    # queries
    def get_verified_orgs():
        query = """
        FOR org IN organizations
            FILTER org.verified == true
            RETURN { "key": org._key, "id": org._id }
        """
        cursor = db.aql.execute(query)
        logging.info(f"Successfully fetched verified orgs")
        return cursor.batch()

    def get_org_domains(org_id):
        query = f"""
        FOR v, e IN 1..1 OUTBOUND @org_id claims
            RETURN v.domain
        """
        cursor = db.aql.execute(query, bind_vars={"org_id": org_id})
        logging.info(f"Successfully fetched domains for org: {org_id}")
        return cursor.batch()

    def get_domain_exists(domain):
        query = """
        FOR domain IN domains
            FILTER domain.domain == @domain
            RETURN domain
        """
        bind_vars = {"domain": domain}
        try:
            cursor = db.aql.execute(query, bind_vars=bind_vars)
            batch = cursor.batch()
            return len(batch) > 0
        except Exception as e:
            logging.error(f"Error occured when checking if domain exists: {e}")
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
            logging.info(f"Successfully created domain: {domain}")
            return created_domain
        except Exception as e:
            logging.error(f"Error occured when creating domain: {e}")
            return None

    def create_claim(org_id, domain_id, domain_name, txn_col):
        insert_claim = {
            "_from": org_id,
            "_to": domain_id,
            "tags": [{"en": "NEW", "fr": "NOUVEAU"}],
            "hidden": False,
            "outsideComment": "",
            "firstSeen": date.today().isoformat(),
        }

        try:
            txn_col.insert(insert_claim)
            logging.info(f"Successfully created claim for domain: {domain_name}")
        except Exception as e:
            logging.error("Error occured when creating claim for ", e)

    def log_activity(domain, org_id, trx_col):
        insert_activity = {
            "timestamp": date.today().isoformat(),
            "initiatedBy": {
                "id": "easm-service",
                "userName": "easm-service",
                "role": "easm-service",
            },
            "target": {
                "resource": domain,
                "updatedProperties": {
                    "name": "tags",
                    "oldValue": [],
                    "newValue": [{"en": "NEW", "fr": "NOUVEAU"}],
                },
                "organization": {
                    "id": org_id,
                },
                "resourceType": "domain",
            },
            "action": "add",
            "reason": "",
        }

        try:
            trx_col.insert(insert_activity)
            logging.info(f"Successfully logged activity for domain: {domain}")
        except Exception as e:
            logging.error(f"Error occured when logging activity for {domain}: {e}")

    # main logic
    async def add_discovered_domain(domains, org_id):
        for domain in domains:
            # check if domain exists in system
            domain_exists = get_domain_exists(domains)
            if domain_exists is None:
                logging.error(f"Error occured when checking if domain exists: {e}")
                continue
            # if domain exists, skip
            elif domain_exists:
                logging.info(f"Domain: {domain} already exists in system")
                continue

            # setup transaction
            txn_db = db.begin_transaction(read=read_cols, write=write_cols)
            # txn_aql = txn_db.aql
            txn_col_domains = txn_db.collection("domains")
            txn_col_claims = txn_db.collection("claims")
            txn_col_audit_logs = txn_db.collection("auditLogs")

            # create domain
            created_domain = await create_domain(domain=domain, txn_col=txn_col_domains)
            # add domain to org
            create_claim(
                org_id=org_id,
                domain_id=created_domain["_id"],
                domain_name=domain,
                txn_col=txn_col_claims,
            )
            # add activity logging
            log_activity(domain=domain, org_id=org_id, trx_col=txn_col_audit_logs)

            # commit transaction
            try:
                txn_db.commit_transaction()
                logging.info(f"Successfully committed transaction for domain: {domain}")
            except Exception as e:
                logging.error(f"Failed to commit transaction for domain: {domain}: {e}")

            # publish domain to NATS
            try:
                await publish(
                    f"{PUBLISH_TO}.{created_domain['_key']}",
                    json.dumps(
                        {
                            "domain": created_domain["domain"],
                            "domain_key": created_domain["_key"],
                        }
                    ).encode(),
                )
                logging.info(f"Published domain: {domain} to NATS")
            except Exception as e:
                logging.error(e)

    try:
        verified_orgs = get_verified_orgs()
    except Exception as e:
        logging.error(e)
        return

    for org in verified_orgs:
        org_key = org["key"]
        org_id = org["id"]

        try:
            domains = get_org_domains(org_id)
        except Exception as e:
            logging.error(e)
            continue

        try:
            labelled_assets = get_labelled_org_assets_from_org_key(org_key)
        except Exception as e:
            logging.error(e)
            continue

        labelled_domains = [asset["AssetName"] for asset in labelled_assets]
        new_domains = list(set(labelled_domains) - set(domains))
        try:
            await add_discovered_domain(new_domains, org_id)
        except Exception as e:
            logging.error(e)
            continue

    try:
        unlabelled_assets = get_unlabelled_assets()
        unclaimed_domains = [asset["AssetName"] for asset in unlabelled_assets]
        await add_discovered_domain(unclaimed_domains, UNCLAIMED_ID)
    except Exception as e:
        logging.error(e)

    logging.info("Closing NATS connection")
    await nc.close()
    logging.info("Successfully closed connection")


if __name__ == "__main__":
    logging.info("Starting EASM-to-Tracker sync")
    asyncio.run(main())
    logging.info(f"EASM-to-Tracker sync shutting down...")
