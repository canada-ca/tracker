import logging
import os
from datetime import date
from arango import ArangoClient
from clients.kusto_client import get_labelled_org_assets_from_org_key
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def get_verified_orgs():
    query = """
    FOR org IN organizations
        FILTER org.verified == true
        RETURN { "key": org._key, "id": org._id }
    """
    cursor = db.aql.execute(query)
    return cursor.batch()


def get_org_domains(org_id):
    query = f"""
    FOR v, e IN 1..1 OUTBOUND @org_id claims
        RETURN v.domain
    """
    cursor = db.aql.execute(query, bind_vars={"org_id": org_id})
    return cursor.batch()


def create_domain(domain):
    insert_domain = {
        "domain": domain.toLowerCase(),
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
    }

    query = """
    INSERT @insert_domain INTO domains
    """
    bind_vars = {"insert_domain": insert_domain}
    cursor = db.aql.execute(query, bind_vars=bind_vars)
    return cursor.batch()[0]


def create_claim(org_id, domain_id):
    insert_claim = {
        "_from": org_id,
        "_to": domain_id,
        "tags": [{"en": "NEW", "fr": "NOUVEAU"}],
        "hidden": False,
        "outsideComment": "",
        "firstSeen": date.today().isoformat(),
    }

    query = """
    INSERT @insert_claim INTO claims
    """
    bind_vars = {"insert_claim": insert_claim}
    db.aql.execute(query, bind_vars=bind_vars)


def add_labelled_domains_to_org(org_id, domains):
    for domain in domains:
        # check if domain exists in system
        query = """
        FOR domain IN domains
            FILTER domain.domain == @domain
            RETURN domain
        """
        bind_vars = {"domain": domain}
        cursor = db.aql.execute(query, bind_vars=bind_vars)
        domain_exists = cursor.batch()

        if domain_exists:
            # add domain to org
            create_claim(org_id, domain_exists["_id"])
        else:
            # create domain
            created_domain = create_domain(domain)
            # add domain to org
            create_claim(org_id, created_domain["_id"])


def update_org_domains():
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
            add_labelled_domains_to_org(org_id, new_domains)
        except Exception as e:
            logging.error(e)
            continue


if __name__ == "__main__":
    logging.info("Starting EASM-to-Tracker sync")
    update_org_domains()
    logging.info(f"EASM-to-Tracker sync shutting down...")
