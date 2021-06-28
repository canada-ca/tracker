import os
import re
import sys
import time
import json
import logging
import traceback
import emoji
import random
import datetime
from arango import ArangoClient

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

SCAN_TYPES = ["https", "ssl", "dkim", "spf", "dmarc"]
CHARTS = {"mail": ["dmarc", "spf", "dkim"], "web": ["https", "ssl"]}

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def update_scan_summaries(host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT):
    logging.info(f"Updating scan summaries...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    for scan_type in SCAN_TYPES:
        scan_pass = 0
        scan_fail = 0
        scan_total = 0
        for domain in db.collection("domains"):
            scan_total = scan_total + 1
            if domain["status"][scan_type] == "fail":
                scan_fail = scan_fail + 1
            elif domain["status"][scan_type] == "pass":
                scan_pass = scan_pass + 1

        current_summary = db.collection("scanSummaries").get({"_key": scan_type})

        summary_exists = current_summary is not None

        if not summary_exists:
            db.collection("scanSummaries").insert(
                {
                    "_key": scan_type,
                    "pass": scan_pass,
                    "fail": scan_fail,
                    "total": scan_total,
                }
            )
        else:
            db.collection("scanSummaries").update_match(
                {"_key": scan_type},
                {"pass": scan_pass, "fail": scan_fail, "total": scan_total},
            )

        logging.info(f"{scan_type} scan summary updated.")

    logging.info(f"Scan summary update completed.")


def update_chart_summaries(host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT):
    logging.info(f"Updating chart summaries...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    for chart_type, scan_types in CHARTS.items():
        pass_count = 0
        fail_count = 0
        domain_total = 0
        for domain in db.collection("domains"):
            domain_total = domain_total + 1
            chart_fail = False
            for scan_type in scan_types:
                if domain["status"][scan_type] == "fail":
                    chart_fail = True

            if chart_fail:
                fail_count = fail_count + 1
            else:
                pass_count = pass_count + 1

        current_summary = db.collection("chartSummaries").get({"_key": chart_type})

        summary_exists = current_summary is not None

        if not summary_exists:
            db.collection("chartSummaries").insert(
                {
                    "_key": chart_type,
                    "pass": pass_count,
                    "fail": fail_count,
                    "total": domain_total,
                }
            )
        else:
            db.collection("chartSummaries").update_match(
                {"_key": chart_type},
                {"pass": pass_count, "fail": fail_count, "total": domain_total},
            )

        logging.info(f"{chart_type} scan summary updated.")

    logging.info(f"Chart summary update completed.")


def update_org_summaries(host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT):
    logging.info(f"Updating organization summary values...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    for org in db.collection("organizations"):
        web_fail = 0
        web_pass = 0
        mail_fail = 0
        mail_pass = 0
        domain_total = 0
        claims = db.collection("claims").find({"_from": org["_id"]})
        for claim in claims:
            domain = db.collection("domains").get({"_id": claim["_to"]})
            domain_total = domain_total + 1

            if (
                domain["status"]["ssl"] == "pass"
                and domain["status"]["https"] == "pass"
            ):
                web_pass = web_pass + 1
            else:
                web_fail = web_fail + 1

            if (
                domain["status"]["dmarc"] == "pass"
                and domain["status"]["spf"] == "pass"
                and domain["status"]["dkim"] == "pass"
            ):
                mail_pass = mail_pass + 1
            else:
                mail_fail = mail_fail + 1

        summary_data = {
            "summaries": {
                "web": {
                    "pass": web_pass,
                    "fail": web_fail,
                    "total": domain_total,
                },
                "mail": {
                    "pass": mail_pass,
                    "fail": mail_fail,
                    "total": domain_total,
                }
            }
        }

        org.update(summary_data)
        db.collection("organizations").update(org)

    logging.info(f"Organization summary value update completed.")


if __name__ == "__main__":
    logging.info(emoji.emojize("Summary service started :rocket:"))
    update_scan_summaries()
    update_chart_summaries()
    update_org_summaries()
    logging.info(f"Summary service shutting down...")
