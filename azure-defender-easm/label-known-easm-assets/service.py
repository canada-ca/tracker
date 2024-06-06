import logging
import re
from arango import ArangoClient
import os
from clients.kusto_client import (
    get_unlabelled_org_assets_from_root,
    get_unlabelled_org_assets_from_domains,
)
from clients.easm_client import label_assets
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

UNCLAIMED_ID = os.getenv("UNCLAIMED_ID")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def get_verified_orgs():
    query = """
    FOR org IN organizations
        FILTER org.verified == true
        FILTER org._key != @unclaimed_id
        SORT org.en.name ASC
        RETURN { "key": org._key, "id": org._id }
    """
    cursor = db.aql.execute(query, bind_vars={"unclaimed_id": UNCLAIMED_ID})
    return [org for org in cursor]


def get_org_domains(org_id):
    query = f"""
    FOR v, e IN 1..1 OUTBOUND @org_id claims
        FILTER e.hidden != true
        FILTER v.archived != true
        FILTER v.rcode != "NXDOMAIN"
        RETURN v.domain
    """
    cursor = db.aql.execute(query, bind_vars={"org_id": org_id})
    return [domain for domain in cursor]


def extract_root_domains(subdomains):
    root_domains_set = set()
    for subdomain in subdomains:
        parts = subdomain.split(".")
        if len(parts) > 1:
            root_domain = ".".join(parts[-3:])
            match = re.match(r"^([^.]+)\.(gc|canada)\.ca$", root_domain)
            if match:
                full_root_domain = match.group(0)
                root_domains_set.add(full_root_domain)

    unique_root_domains = list(root_domains_set)
    return unique_root_domains


def update_asset_labels():
    # Get verified org ids
    try:
        logging.info("Getting verified orgs")
        verified_orgs = get_verified_orgs()
        logging.info(f"Found {len(verified_orgs)} verified orgs")
    except Exception as e:
        logging.error(e)
        return
    for org in verified_orgs:
        # Get org domains
        try:
            logging.info(f"Getting domains for org {org['key']}")
            org_domains = get_org_domains(org["id"])
            logging.info(f"Found {len(org_domains)} domains")
        except Exception as e:
            logging.error(e)
            continue

        # label known assets first
        try:
            logging.info(f"Labeling known assets for org {org['key']}")
            known_org_assets = get_unlabelled_org_assets_from_domains(org_domains)
            logging.info(
                "Found " + str(len(known_org_assets)) + " known unlabelled assets"
            )
            label_assets(assets=known_org_assets, label=org["key"])
        except Exception as e:
            logging.error(e)
            continue

    for org in verified_orgs:
        # Get org domains
        try:
            logging.info(f"Getting domains for org {org['key']}")
            org_domains = get_org_domains(org["id"])
            logging.info(f"Found {len(org_domains)} domains")
        except Exception as e:
            logging.error(e)
            continue

        # Extract root domains
        try:
            unique_roots = extract_root_domains(org_domains)
        except Exception as e:
            logging.error(e)

        for root in unique_roots:
            try:
                logging.info(f"Root domain: {root}")
                # get unlabelled assets from roots
                unlabelled_org_assets = get_unlabelled_org_assets_from_root(root)
                logging.info(
                    "Found " + str(len(unlabelled_org_assets)) + " unlabelled assets"
                )
                label_assets(assets=unlabelled_org_assets, label=org["key"])
            except Exception as e:
                logging.error(e)
                continue


if __name__ == "__main__":
    logging.info("EASM label service started")
    update_asset_labels()
    logging.info(f"EASM label service shutting down...")
