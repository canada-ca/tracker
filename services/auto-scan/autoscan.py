import os
import sys
import logging
import requests
import datetime
import traceback
from arango import ArangoClient
from uuid import uuid4 as unique_id

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

QUEUE_URL = "http://scan-queue.scanners.svc.cluster.local"


def dispatch_https(domain, client):
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "uuid": None,
    }
    client.post(QUEUE_URL + "/https", json=payload)


def dispatch_ssl(domain, client):
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "uuid": None,
    }
    client.post(QUEUE_URL + "/ssl", json=payload)


def dispatch_dns(domain, client):
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "selectors": domain.get("selectors", None),
        "uuid": None,
    }
    client.post(QUEUE_URL + "/dns", json=payload)


def scan(db_host, db_name, user_name, password, http_client=requests):
    logging.info("Retrieving domains for scheduled scan...")
    try:
        # Establish DB connection
        arango_client = ArangoClient(hosts=db_host)
        db = arango_client.db(db_name, username=user_name, password=password)

        logging.info("Querying domains...")

        domains = db.collection("domains").all()

        scan_time = str(datetime.datetime.utcnow())
        count = 0

        for domain in domains:
            count = count + 1
            logging.info(f"Dispatching scan number {count} of {len(domains)}")
            logging.info(f"Requesting scan for {domain['domain']}")

            db.collection("domains").update_match({"_key": domain["_key"]}, {"lastRan": scan_time})

            dispatch_https(domain, http_client)
            dispatch_ssl(domain, http_client)
            dispatch_dns(domain, http_client)

    except Exception as e:
        logging.error(
            f"An unexpected error occurred while initiating scheduled scan: {str(e)}\n\nFull traceback: {traceback.format_exc()}"
        )
        return count-1
    logging.info("Domains have been dispatched for scanning.")
    return count

if __name__ == "__main__":
    dispatched_count = scan(DB_HOST, DB_NAME, DB_USER, DB_PASS)
    logging.info(f"Dispatched scans for {dispatched_count} domains.")
