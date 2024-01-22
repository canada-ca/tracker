import logging
import re
from arango import ArangoClient
import os
from kusto_client import get_unlabelled_org_assets_from_roots
from update_asset import label_assets
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def get_verified_org_ids():
    query = """
    FOR org IN organizations
        FILTER org.verified == true
        RETURN org._id
    """
    cursor = db.aql.execute(query)
    return cursor.all()


def get_org_domains(org_id):
    query = f"""
    FOR v, e IN 1..1 OUTBOUND @org_id claims
        RETURN v.domain
    """
    cursor = db.aql.execute(query, bind_vars={"org_id": org_id})
    return cursor.all()


def extract_root_domains(subdomains):
    root_domains_set = set()
    for subdomain in subdomains:
        parts = subdomain.split(".")
        if len(parts) > 1:
            root_domain = ".".join(parts[-3:])
            match = re.match(r"^([^.]+)\.(gc|canada)\.ca$", root_domain)
            if match:
                full_root_domain = match.group(2)
                root_domains_set.add(full_root_domain)

    unique_root_domains = list(root_domains_set)
    return unique_root_domains


def update_asset_labels():
    # Get verified org ids
    verified_org_ids = get_verified_org_ids()

    for org_id in verified_org_ids:
        # Get org domains
        org_domains = get_org_domains(org_id)

        # Extract root domains
        unique_roots = extract_root_domains(org_domains)

        # get unlabelled assets from roots
        unlabelled_org_assets = get_unlabelled_org_assets_from_roots(unique_roots)
        label_assets(assets=unlabelled_org_assets, label="test")


if __name__ == "__main__":
    logging.info("EASM label service started")
    update_asset_labels()
    logging.info(f"EASM label service shutting down...")
