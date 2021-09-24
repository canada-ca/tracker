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


logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def update_guidance(guidance_data, db):
    for entry in guidance_data:
        if entry["file"] == "scanSummaryCriteria.json":
            # TODO: this service should not be creating database collections and
            # hardcoding options like replication_factor
            if not db.has_collection("scanSummaryCriteria"):
                db.create_collection(
                    name="scanSummaryCriteria",
                    replication_factor=3,
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
                    replication_factor=3,
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
                        {
                            "pass": criteria.get("pass", []),
                            "fail": criteria.get("fail", []),
                        },
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
                    replication_factor=3,
                    shard_count=6,
                    write_concern=1,
                )
            for tag_key, tag_data in entry["guidance"].items():
                new_tag = {
                    "_key": tag_key,
                    "en": tag_data["en"],
                    "fr": tag_data["fr"],
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
                            "en": tag_data["en"],
                            "fr": tag_data["fr"],
                        },
                    )
                    logging.info(f"Tag {tag_key} updated.")
                else:
                    logging.info(f"Tag {tag_key} not updated.")

    logging.info(f"Guidance update completed.")


if __name__ == "__main__":
    load_dotenv()

    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")
    DB_NAME = os.getenv("DB_NAME")
    DB_URL = os.getenv("DB_URL")

    logging.info(emoji.emojize("Guidance service started :rocket:"))

    current_directory = os.path.dirname(os.path.realpath(__file__))
    guidance_file = open(f"{current_directory}/guidance.json")
    guidance_data = json.load(guidance_file)

    # Establish DB connection
    client = ArangoClient(hosts=DB_URL)
    db = client.db(DB_NAME, username=DB_USER, password=DB_PASS)

    update_guidance(guidance_data, db)
    guidance_file.close()
    logging.info(f"Guidance service shutting down...")
