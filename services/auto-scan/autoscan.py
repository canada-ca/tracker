"""This module primarily functions as a script that connects to the database and
dispatches a request to the scan queue for each domain and scan type.

Needs environment variables (see below for list) seeded from a secret in the cluster to function.
"""
import os
import sys
import logging
import requests
import datetime
import traceback
from arango import ArangoClient

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
QUEUE_URL = os.getenv("SCAN_QUEUE_URL", "http://scan-queue.scanners.svc.cluster.local")


def dispatch_https(domain, client):
    """This function dispatches a scan request to the HTTPS scanner

    :param dict domain: A domain obtained from the DB's domains collection.
    :param requests client: HTTP client used to post the payload to the queue.
    :return: nothing
    :rtype: None
    """
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "uuid": None,
    }
    client.post(QUEUE_URL + "/https", json=payload)


def dispatch_ssl(domain, client):
    """This function dispatches a scan request to the SSL scanner

    :param dict domain: A domain obtained from the DB's domains collection.
    :param requests client: HTTP client used to post the payload to the queue.
    :return: nothing
    :rtype: None
    """
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "uuid": None,
    }
    client.post(QUEUE_URL + "/ssl", json=payload)


def dispatch_dns(domain, client):
    """This function dispatches a scan request to the DNS scanner

    :param dict domain: A domain obtained from the DB's domains collection.
    :param requests client: HTTP client used to post the payload to the queue.
    :return: nothing
    :rtype: None
    """
    payload = {
        "domain_key": domain["_key"],
        "domain": domain["domain"],
        "selectors": domain.get("selectors", None),
        "uuid": None,
    }
    client.post(QUEUE_URL + "/dns", json=payload)


def scan(db_host, db_port, db_name, user_name, password, http_client=requests):
    """Uses credentials provided to queue scans for all domains in the Tracker DB

    :param str db_host: DB host name.
    :param db_port: DB TCP port.
    :param str db_name: Name of the DB to connect to.
    :param str user_name: Username to connect to DB with.
    :param str password: Password to connect to DB with.
    :param requests http_client: HTTP client to supply to dispatch functions, defaults to requests
    :return: count of domains scans were dispatched for
    :rtype: int
    """
    logging.info("Retrieving domains for scheduled scan...")
    try:
        # Establish DB connection
        connection_string = f"http://{db_host}:{db_port}"
        arango_client = ArangoClient(hosts=connection_string)
        db = arango_client.db(db_name, username=user_name, password=password)

        logging.info("Querying domains...")

        domains = db.collection("domains").all()

        scan_time = str(datetime.datetime.utcnow())
        count = 0

        for domain in domains:
            count = count + 1
            logging.info(f"Dispatching scan number {count} of {len(domains)}")
            logging.info(f"Requesting scan for {domain['domain']}")

            # Update the 'lastRan' timestamp on the domain being scanned
            db.collection("domains").update_match(
                {"_key": domain["_key"]}, {"lastRan": scan_time}
            )

            dispatch_https(domain, http_client)
            dispatch_ssl(domain, http_client)
            dispatch_dns(domain, http_client)

    except Exception as e:
        logging.error(
            f"An unexpected error occurred while initiating scheduled scan: {str(e)}\n\nFull traceback: {traceback.format_exc()}"
        )
        return count - 1
    logging.info("Domains have been dispatched for scanning.")
    return count


if __name__ == "__main__":
    dispatched_count = scan(DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS)
    logging.info(f"Dispatched scans for {dispatched_count} domains.")
