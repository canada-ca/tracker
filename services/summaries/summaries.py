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
from dotenv import load_dotenv


DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

SCAN_TYPES = ["https", "ssl", "dkim", "spf", "dmarc"]
CHARTS = {"mail": ["dmarc", "spf", "dkim"], "web": ["https", "ssl"], "https": ["https"]}

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
            # We don't want to count domains not passing or failing
            # (i.e unreachable or unscanned) towards the total.
            if domain["status"][scan_type] == "fail":
                scan_total = scan_total + 1
                scan_fail = scan_fail + 1

            elif domain["status"][scan_type] == "pass":
                scan_total = scan_total + 1
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


def update_dmarc_phase_chart_summaries(db):
    """Update the dmarc phase chart summaries in the database

    :param db: active arangodb connection
    """

    # DMARC phases:
    # 0. Not Implemented
    # 1. Assess
    # 2. Deploy
    # 3. Enforce
    # 4. Maintain

    not_implemented_count = 0
    assess_count = 0
    deploy_count = 0
    enforce_count = 0
    maintain_count = 0

    domain_total = 0

    for domain in db.collection("domains"):

        phase = domain.get("phase")

        if phase is None:
            logging.info(f"Property \"phase\" does not exist for domain \"${domain['domain']}\".")
            continue

        if phase == "not implemented":
            not_implemented_count = not_implemented_count + 1
        elif phase == "assess":
            assess_count = assess_count + 1
        elif phase == "deploy":
            deploy_count = deploy_count + 1
        elif phase == "enforce":
            enforce_count = enforce_count + 1
        elif phase == "maintain":
            maintain_count = maintain_count + 1

    domain_total = not_implemented_count + assess_count + deploy_count + \
                   enforce_count + maintain_count

    current_summary = db.collection("chartSummaries").get({"_key": "dmarc_phase"})

    summary_exists = current_summary is not None

    if not summary_exists:
        db.collection("chartSummaries").insert(
            {
                "_key": "dmarc_phase",
                "not_implemented": not_implemented_count,
                "assess": assess_count,
                "deploy": deploy_count,
                "enforce": enforce_count,
                "maintain": maintain_count,
                "total": domain_total,
            }
        )
    else:
        db.collection("chartSummaries").update_match(
            {"_key": "dmarc_phase"},
            {
                "not_implemented": not_implemented_count,
                "assess": assess_count,
                "deploy": deploy_count,
                "enforce": enforce_count,
                "maintain": maintain_count,
                "total": domain_total,},
        )

    logging.info("DMARC phase scan summary updated.")


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
            category_status = []
            for scan_type in scan_types:
                category_status.append(domain["status"][scan_type])

            if "fail" in category_status:
                fail_count = fail_count + 1
            elif "info" not in category_status:
                pass_count = pass_count + 1


        domain_total = pass_count + fail_count
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

    # handle DMARC phase summary
    update_dmarc_phase_chart_summaries(db)

    logging.info(f"Chart summary update completed.")


def update_org_summaries(host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT):
    logging.info(f"Updating organization summary values...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    for org in db.collection("organizations"):
        dmarc_pass = 0
        dmarc_fail = 0
        https_fail = 0
        https_pass = 0
        web_fail = 0
        web_pass = 0
        mail_fail = 0
        mail_pass = 0
        dmarc_phase_not_implemented = 0
        dmarc_phase_assess = 0
        dmarc_phase_deploy = 0
        dmarc_phase_enforce = 0
        dmarc_phase_maintain = 0
        domain_total = 0
        claims = db.collection("claims").find({"_from": org["_id"]})
        for claim in claims:
            domain = db.collection("domains").get({"_id": claim["_to"]})
            domain_total = domain_total + 1

            if (domain["status"]["dmarc"] == "pass"):
                dmarc_pass = dmarc_pass + 1
            else:
                dmarc_fail = dmarc_fail + 1

            if (
                domain["status"]["ssl"] == "pass"
                and domain["status"]["https"] == "pass"
            ):
                web_pass = web_pass + 1
            elif(
                domain["status"]["ssl"] == "fail"
                or domain["status"]["https"] == "fail"
            ):
                web_fail = web_fail + 1

            if (domain["status"]["https"] == "pass"):
                https_pass = https_pass + 1
            if (domain["status"]["https"] == "fail"):
                https_fail = https_fail + 1

            if (
                domain["status"]["dmarc"] == "pass"
                and domain["status"]["spf"] == "pass"
                and domain["status"]["dkim"] == "pass"
            ):
                mail_pass = mail_pass + 1
            else:
                mail_fail = mail_fail + 1

            phase = domain.get("phase")

            if phase is None:
                logging.info(f"Property \"phase\" does not exist for domain \"${domain['domain']}\".")
                continue

            if phase == "not implemented":
                dmarc_phase_not_implemented = dmarc_phase_not_implemented + 1
            elif phase == "assess":
                dmarc_phase_assess = dmarc_phase_assess + 1
            elif phase == "deploy":
                dmarc_phase_deploy = dmarc_phase_deploy + 1
            elif phase == "enforce":
                dmarc_phase_enforce = dmarc_phase_enforce + 1
            elif phase == "maintain":
                dmarc_phase_maintain = dmarc_phase_maintain + 1

        summary_data = {
            "summaries": {
                "dmarc": {
                    "pass": dmarc_pass,
                    "fail": dmarc_fail,
                },
                "web": {
                    "pass": web_pass,
                    "fail": web_fail,
                    "total": web_pass + web_fail, # Don't count non web-hosting domains
                },
                "mail": {
                    "pass": mail_pass,
                    "fail": mail_fail,
                    "total": domain_total,
                },
                "dmarc_phase": {
                        "not_implemented": dmarc_phase_not_implemented,
                        "assess": dmarc_phase_assess,
                        "deploy": dmarc_phase_deploy,
                        "enforce": dmarc_phase_enforce,
                        "maintain": dmarc_phase_maintain,
                        "total": domain_total,
                },
                "https": {
                    "pass": https_pass,
                    "fail": https_fail,
                    "total": https_pass + https_fail  # Don't count non web-hosting domains
                }
            }
        }

        org.update(summary_data)
        db.collection("organizations").update(org)

    logging.info(f"Organization summary value update completed.")


if __name__ == "__main__":
    load_dotenv()
    logging.info(emoji.emojize("Summary service started :rocket:"))
    update_scan_summaries()
    update_chart_summaries()
    update_org_summaries()
    logging.info(f"Summary service shutting down...")
