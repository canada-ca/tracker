import json
from datetime import datetime
from arango import ArangoClient
import os
from clients.kusto_client import (
    get_web_components_by_asset,
    get_additional_findings_by_asset,
)
from dotenv import load_dotenv
import logging

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


# fetch all domains from the DB
def get_all_domains():
    query = """
    FOR domain IN domains
        FILTER domain.archived != True
        FILTER domain.rcode != "NXDOMAIN"
        RETURN { "domain": domain.domain, "id": domain._id, "key": domain._key, "ignoredCves": domain.ignoredCves || [] }
    """
    cursor = db.aql.execute(query)
    return [domain for domain in cursor]


def upsert_finding(finding):
    query = f"""
    UPSERT {{ domain: "{finding["domain"]}" }}
        INSERT {finding}
        UPDATE {finding}
        IN additionalFindings
    """
    cursor = db.aql.execute(query)
    return [domain for domain in cursor]


def remove_none_val_in_dict(dict):
    new_dict = {}
    for k, v in dict:
        if v is None:
            v = ""
        new_dict[k] = v
    return new_dict


def update_domain_cve_detected(domain, web_components):
    cve_detected = False
    ignored_cves = domain["ignoredCves"] if domain["ignoredCves"] else []
    for wc in web_components:
        non_ignored_cves = [
            cve for cve in wc["WebComponentCves"] if cve["Cve"] not in ignored_cves
        ]
        if len(non_ignored_cves) > 0:
            cve_detected = True
            break
    query = f"""
        UPDATE {{ _key: "{domain["key"]}", cveDetected: {cve_detected} }} IN domains
    """
    cursor = db.aql.execute(query)
    return [domain for domain in cursor]


def main():
    try:
        domains = get_all_domains()
    except Exception as e:
        logger.error(f"Failed to fetch domains: {e}. Exiting service...")
        return
    logger.info(f"Successfully fetched {len(domains)} domains")

    for domain in domains:
        if domain["domain"] != "www.forces.ca":
            continue
        logger.info(f"Processing domain {domain['domain']}")
        try:
            web_components = get_web_components_by_asset(domain["domain"])
            additional_findings = get_additional_findings_by_asset(domain["domain"])

            insert_str = json.dumps(
                {
                    "domain": domain["id"],
                    "timestamp": datetime.today().isoformat(),
                    "webComponents": web_components,
                    "locations": additional_findings["Locations"],
                    "ports": additional_findings["Ports"],
                    "headers": additional_findings["Headers"],
                }
            )
            insert_obj = json.loads(
                insert_str, object_pairs_hook=remove_none_val_in_dict
            )

            # insert the findings into the DB
            logger.info(f"Upserting additional findings for domain {domain['domain']}")
            upsert_finding(insert_obj)
            update_domain_cve_detected(domain, web_components)
        except Exception as e:
            logger.error(f"Failed to process domain {domain['domain']}: {e}")
            continue
        logger.info(
            f"Successfully upserted additional findings for domain {domain['domain']}"
        )


if __name__ == "__main__":
    logger.info("EASM additional findings import service started")
    main()
    logger.info(f"EASM additional findings import service shutting down...")
