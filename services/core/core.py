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
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
REPO_NAME = os.getenv("REPO_NAME")
REPO_OWNER = os.getenv("REPO_OWNER")
GUIDANCE_DIR = os.getenv("GUIDANCE_DIR")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

SCAN_TYPES = ["https", "ssl", "dkim", "spf", "dmarc"]
CHARTS = {"mail": ["dmarc", "spf", "dkim"], "web": ["https", "ssl"]}

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def retrieve_guidance(
    token=GITHUB_TOKEN, owner=REPO_OWNER, repo=REPO_NAME, directory=GUIDANCE_DIR
):
    logging.info(f"Retrieving guidance...")

    gh_client = Client(
        transport=RequestsHTTPTransport(
            url="https://api.github.com/graphql",
            headers={"Authorization": "bearer " + token},
        ),
        fetch_schema_from_transport=True,
    )

    guidance = []

    # fmt: off
    guidance_files_query = """
    {{
      repository(name: "{REPO_NAME}", owner: "{REPO_OWNER}") {{
        id
        object(expression: "master:{GUIDANCE_DIR}") {{
          ... on Tree {{
            entries {{
                name
            }}
          }}
        }}
      }}
    }}
    """.format(**{"REPO_NAME": repo, "REPO_OWNER": owner, "GUIDANCE_DIR": directory})
    # fmt: on
    guidance_files_result = gh_client.execute(gql(guidance_files_query))
    file_names = []

    for file in guidance_files_result["repository"]["object"]["entries"]:
        file_names.append(file["name"])

    for file_name in file_names:
        # fmt: off
        guidance_query = """
        {{
          repository(name: "{REPO_NAME}", owner: "{REPO_OWNER}") {{
            id
            object(expression: "master:{GUIDANCE_DIR}/{FILE_NAME}") {{
              ... on Blob {{
                text
              }}
            }}
          }}
        }}
        """.format(**{"REPO_NAME": repo, "REPO_OWNER": owner, "GUIDANCE_DIR": directory, "FILE_NAME": file_name})
        # fmt: on
        guidance_result = gh_client.execute(gql(guidance_query))
        try:
            guidance.append(
                {
                    "file": file_name,
                    "guidance": json.loads(
                        guidance_result["repository"]["object"]["text"]
                    ),
                }
            )
        except KeyError:
            pass

    logging.info(f"Guidance retrieved.")

    return guidance


def update_guidance(
    guidance_data, host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
):
    logging.info(f"Updating guidance...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    for entry in guidance_data:
        if entry["file"] == "scanSummaryCriteria.json":
            if not db.has_collection("scanSummaryCriteria"):
                db.create_collection(
                    name="scanSummaryCriteria",
                    replication_factor=2,
                    shard_count=6,
                    write_concern=1,
                )
            for criteria_type, criteria in entry["guidance"].items():
                new_criteria = {
                    "_key": criteria_type,
                    "pass": criteria.get("pass", []),
                    "fail": criteria.get("fail", []),
                    "warning": criteria.get("warning", []),
                    "info": criteria.get("info", []),
                }

                logging.info(
                    f"Checking if scan summary criteria {criteria_type} exists..."
                )
                current_criteria = db.collection("scanSummaryCriteria").get(
                    {"_key": criteria_type}
                )

                criteria_exists = current_criteria is not None
                criteria_updated = criteria_exists and (
                    current_criteria != new_criteria
                )

                # Insert if the criteria doesn't exist
                if not criteria_exists:
                    db.collection("scanSummaryCriteria").insert(new_criteria)
                    logging.info(f"Scan summary criteria {criteria_type} inserted.")
                # Update if the criteria has changed
                elif criteria_updated:
                    db.collection("scanSummaryCriteria").update_match(
                        {"_key": criteria_type},
                        {
                            "pass": criteria.get("pass", []),
                            "fail": criteria.get("fail", []),
                            "info": criteria.get("info", []),
                        },
                    )
                    logging.info(f"Scan summary criteria {criteria_type} updated.")
                else:
                    logging.info(f"Scan summary criteria {criteria_type} not updated.")

        elif entry["file"] == "chartSummaryCriteria.json":
            if not db.has_collection("chartSummaryCriteria"):
                db.create_collection(
                    "chartSummaryCriteria",
                    replication_factor=2,
                    shard_count=6,
                    write_concern=1,
                )
            for criteria_type, criteria in entry["guidance"].items():
                new_criteria = {
                    "_key": criteria_type,
                    "pass": criteria.get("pass", []),
                    "fail": criteria.get("fail", []),
                }

                logging.info(
                    f"Checking if chart summary criteria {criteria_type} exists..."
                )
                current_criteria = db.collection("chartSummaryCriteria").get(
                    {"_key": criteria_type}
                )

                criteria_exists = current_criteria is not None
                criteria_updated = criteria_exists and (
                    current_criteria != new_criteria
                )

                # Insert if the criteria doesn't exist
                if not criteria_exists:
                    db.collection("chartSummaryCriteria").insert(new_criteria)
                    logging.info(f"Chart summary criteria {criteria_type} inserted.")
                # Update if the criteria has changed
                elif criteria_updated:
                    db.collection("chartSummaryCriteria").update_match(
                        {"_key": criteria_type},
                        {"pass": criteria.get("pass", []), "fail": criteria.get("fail", [])},
                    )
                    logging.info(f"Chart summary criteria {criteria_type} updated.")
                else:
                    logging.info(f"Chart summary criteria {criteria_type} not updated.")

        else:
            file_name = entry["file"].split(".json")[0]
            tag_type = file_name.split("tags_")[1]
            if not db.has_collection(f"{tag_type}GuidanceTags"):
                db.create_collection(
                    f"{tag_type}GuidanceTags",
                    replication_factor=2,
                    shard_count=6,
                    write_concern=1,
                )
            for tag_key, tag_data in entry["guidance"].items():
                new_tag = {
                    "_key": tag_key,
                    "tagName": tag_data["tagName"],
                    "guidance": tag_data["guidance"],
                    "refLinksGuide": tag_data.get("refLinksGuide", None),
                    "refLinksTechnical": tag_data.get("refLinksTechnical", None),
                }

                logging.info(f"Checking if tag {tag_key} exists...")
                current_tag = db.collection(f"{tag_type}GuidanceTags").get(
                    {"_key": tag_key}
                )

                tag_exists = current_tag is not None
                tag_updated = tag_exists and (current_tag != new_tag)

                # Insert if the tag doesn't exist
                if not tag_exists:
                    db.collection(f"{tag_type}GuidanceTags").insert(new_tag)
                    logging.info(f"Tag {tag_key} inserted.")
                # Update if the tag has changed
                elif tag_updated:
                    db.collection(f"{tag_type}GuidanceTags").update_match(
                        {"_key": tag_key},
                        {
                            "tagName": tag_data["tagName"],
                            "guidance": tag_data["guidance"],
                            "refLinksGuide": tag_data.get("refLinksGuide", None),
                            "refLinksTechnical": tag_data.get(
                                "refLinksTechnical", None
                            ),
                        },
                    )
                    logging.info(f"Tag {tag_key} updated.")
                else:
                    logging.info(f"Tag {tag_key} not updated.")

    logging.info(f"Guidance update completed.")


def update_scan_summaries(host=DB_HOST, name=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT):
    logging.info(f"Updating scan summaries...")

    # Establish DB connection
    connection_string = f"http://{host}:{port}"
    client = ArangoClient(hosts=connection_string)
    db = client.db(name, username=user, password=password)

    if not db.has_collection("scanSummaries"):
        db.create_collection(
            "scanSummaries",
            replication_factor=2,
            shard_count=6,
            write_concern=1,
        )

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

    if not db.has_collection("chartSummaries"):
        db.create_collection(
            "chartSummaries",
            replication_factor=2,
            shard_count=6,
            write_concern=1,
        )

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

        summaries = {}
        summaries["web"] = {
            "pass": web_pass,
            "fail": web_fail,
            "total": domain_total,
        }
        summaries["mail"] = {
            "pass": mail_pass,
            "fail": mail_fail,
            "total": domain_total,
        }
        org.update(summaries)
        db.collection("organizations").update(org)

    logging.info(f"Organization summary value update completed.")


if __name__ == "__main__":
    logging.info(emoji.emojize("Core service started :rocket:"))
    guidance_data = retrieve_guidance()
    update_guidance(guidance_data)
    update_scan_summaries()
    update_chart_summaries()
    update_org_summaries()
    logging.info(f"Core service shutting down...")
