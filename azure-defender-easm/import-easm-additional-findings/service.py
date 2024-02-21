import logging
import json
from datetime import datetime
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
        FILTER domain.domain == "atsscf.atssc-scdata.gc.ca" 
        RETURN { "domain": domain.domain, "id": domain._id }
    """
    cursor = db.aql.execute(query)
    return cursor.batch()


def upsert_finding(finding):
    query = f"""
    UPSERT {{ domain: "{finding["domain"]}" }}
        INSERT {finding}
        UPDATE {finding}
        IN easmFindings
    """
    cursor = db.aql.execute(query)
    return cursor.batch()


def remove_none_val_in_dict(dict):
    new_dict = {}
    for k, v in dict:
        if v is None:
            v = ""
        new_dict[k] = v
    return new_dict


def main():
    try:
        domains = get_all_domains()
    except Exception as e:
        print(f"Failed to fetch domains from the DB: {e}")
        return
    print(f"Successfully fetched {len(domains)} domains")

    for domain in domains:
        print(f"Processing domain {domain['domain']}")
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
            print(f"Upserting additional findings for domain {domain['domain']}")
            upsert_finding(insert_obj)
            print(
                f"Successfully upserted additional findings for domain {domain['domain']}"
            )
        except Exception as e:
            print(f"Failed to process domain {domain['domain']}: {e}")
            continue


if __name__ == "__main__":
    print("EASM additional findings import service started")
    main()
    print(f"EASM additional findings import service shutting down...")
