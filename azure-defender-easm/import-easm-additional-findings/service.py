import logging
from datetime import date
from arango import ArangoClient
import os
from clients.kusto_client import (
    get_web_components_by_asset,
    get_additional_findings_by_asset,
)
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


# fetch all domains from the DB
def get_all_domains():
    query = """
    FOR domain IN domains
        FILTER domain.archived != True
        FILTER domain.rcode != "NXDOMAIN"
        RETURN { "domain": domain.domain, "id": domain._id }
    """
    cursor = db.aql.execute(query)
    return cursor.batch()


def upsert_finding(finding):
    query = f"""
    UPSERT {{ "domain": {finding["domain"]} }}
        INSERT {finding}
        UPDATE {finding}
        IN easmFindings
    """
    cursor = db.aql.execute(query)
    return cursor.batch()


def main():
    try:
        domains = get_all_domains()
    except Exception as e:
        logging.error(f"Failed to fetch domains from the DB: {e}")
        return
    logging.info(f"Successfully fetched {len(domains)} domains")

    for domain in domains:
        try:
            domain = domain["domain"]
            web_components = get_web_components_by_asset(domain)
            additional_findings = get_additional_findings_by_asset(domain)

            insert_obj = {
                "domain": domain["_id"],
                "date": date.today().isoformat(),
                "web_components": web_components,
                "locations": additional_findings[0]["Locations"],
                "ports": additional_findings[0]["Ports"],
                "headers": additional_findings[0]["Headers"],
            }

            # insert the findings into the DB
            logging.info(f"Upserting additional findings for domain {domain}")
            upsert_finding(insert_obj)
            logging.info(
                f"Successfully upserted additional findings for domain {domain}"
            )
        except Exception as e:
            logging.error(f"Failed to process domain {domain}: {e}")


if __name__ == "__main__":
    logging.info("EASM additional findings import service started")
    main()
    logging.info(f"EASM additional findings import service shutting down...")
