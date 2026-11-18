import argparse
import csv
import logging
import os
import shutil
import sys
import tempfile

import yaml
from arango import ArangoClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger(__name__)

ARANGO_URL = os.getenv("ARANGO_URL")
ARANGO_DATABASE = os.getenv("ARANGO_DATABASE")
ARANGO_USERNAME = os.getenv("ARANGO_USERNAME")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD")

NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY")
NOTIFICATION_API_URL = os.getenv("NOTIFICATION_API_URL")
SERVICE_ACCOUNT_EMAIL = os.getenv("SERVICE_ACCOUNT_EMAIL")
NOTIFICATION_UPTIME_ALERT_ID = os.getenv("NOTIFICATION_UPTIME_ALERT_ID")

GATUS_CONFIG_PATH = os.getenv("GATUS_CONFIG_PATH", "/config/config.yaml")

CSV_REQUIRED_HEADERS = ("Task Name", "Task URL EN", "Institution")
CSV_DEFAULT_GROUP = "Unknown"


def build_alerting():
    return {
        "custom": {
            "method": "POST",
            "url": f"{NOTIFICATION_API_URL}/v2/notifications/email",
            "body": f'{{\n  "email_address": "{SERVICE_ACCOUNT_EMAIL}",\n  "template_id": "{NOTIFICATION_UPTIME_ALERT_ID}",\n  "personalisation": {{\n    "endpoint": "[ENDPOINT_NAME]",\n    "url": "[ENDPOINT_URL]",\n    "status": "[ALERT_TRIGGERED_OR_RESOLVED]"\n  }}\n}}\n',
            "headers": {
                "Content-Type": "application/json",
                "Authorization": NOTIFICATION_API_KEY,
            },
            "default-alert": {
                "enabled": True,
                "failure-threshold": 3,
                "success-threshold": 2,
                "send-on-resolved": True,
            },
        }
    }


def build_endpoint(name, url, group=None):
    """Build a Gatus endpoint. The "group" key is included only when group is set."""
    group_entry = {"group": group} if group else {}
    return {
        "name": name,
        "url": url,
        **group_entry,
        "interval": "5m",
        "conditions": [
            "[STATUS] == any(200, 429)",  # prevents rate limiting from triggering alerts
            "[RESPONSE_TIME] < 30000",
        ],
        "headers": {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0 Tracker-Suivi (+https://github.com/canada-ca/tracker)",
        },
        "alerts": [{"type": "custom"}],
        "client": {
            "insecure": True,  # bypasses TLS verification, removes false positives
            "ignore-redirect": False,
            "timeout": "30s",
        },
    }


def build_config(endpoints):
    return {
        "web": {"port": 8080, "path-prefix": "/uptime"},
        "storage": {"type": "memory"},
        "metrics": False,
        "endpoints": endpoints,
        "alerting": build_alerting(),
    }


def parse_csv_rows(rows):
    """Turn CSV row dicts into endpoint dicts.

    Rows with an empty name or URL are skipped with a warning. An empty
    Institution becomes the group "Unknown". Gatus keys endpoints by
    group and name, so a later row repeating a (group, name) pair is skipped.
    """
    endpoints = []
    seen = set()
    for line_number, row in enumerate(rows, start=2):  # line 1 is the header
        name = (row.get("Task Name") or "").strip()
        url = (row.get("Task URL EN") or "").strip()
        group = (row.get("Institution") or "").strip() or CSV_DEFAULT_GROUP

        if not name or not url:
            log.warning(f"CSV line {line_number}: skipping row with empty name or URL")
            continue
        if (group, name) in seen:
            log.warning(
                f"CSV line {line_number}: skipping duplicate endpoint '{name}' in group '{group}'"
            )
            continue

        seen.add((group, name))
        endpoints.append(build_endpoint(name, url, group))
    return endpoints


def read_csv_endpoints(path):
    """Read a CSV file and return its endpoints. Exit with status 1 on any read or header error."""
    try:
        with open(path, encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            missing = [h for h in CSV_REQUIRED_HEADERS if h not in (reader.fieldnames or [])]
            if missing:
                log.error(f"CSV is missing required column(s): {', '.join(missing)}")
                sys.exit(1)
            return parse_csv_rows(reader)
    except (OSError, UnicodeDecodeError, csv.Error) as e:
        log.error(f"CSV read failed: {e}")
        sys.exit(1)


def read_arango_endpoints():
    """Query ArangoDB for high availability domains and return their endpoints."""
    log.info("Connecting to ArangoDB...")
    try:
        client = ArangoClient(hosts=ARANGO_URL)
        db = client.db(ARANGO_DATABASE, username=ARANGO_USERNAME, password=ARANGO_PASSWORD)
        db.version()  # validate connection
    except Exception as e:
        log.error(f"ArangoDB connection failed: {e}")
        sys.exit(1)

    log.info("Querying high availability services...")
    try:
        cursor = db.aql.execute(
            "FOR d IN domains FILTER d.highAvailability == true RETURN d.domain"
        )
        docs = list(cursor)
    except Exception as e:
        log.error(f"ArangoDB query failed: {e}")
        sys.exit(1)

    log.info(f"Query returned {len(docs)} document(s)")

    return [build_endpoint(name=doc, url=f"https://{doc}") for doc in docs]


def main():
    parser = argparse.ArgumentParser(description="Generate the Gatus config file.")
    parser.add_argument(
        "--csv",
        metavar="PATH",
        help="read endpoints from a CSV file instead of ArangoDB",
    )
    args = parser.parse_args()

    endpoints = read_csv_endpoints(args.csv) if args.csv else read_arango_endpoints()
    config = build_config(endpoints)

    config_dir = os.path.dirname(GATUS_CONFIG_PATH)
    log.info(f"Writing config to {GATUS_CONFIG_PATH}")
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", dir=config_dir, suffix=".tmp", delete=False
        ) as tmp:
            tmp_path = tmp.name
            yaml.dump(
                config,
                tmp,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
            )
        shutil.move(tmp_path, GATUS_CONFIG_PATH)
    except Exception as e:
        log.error(f"Config write failed: {e}")
        sys.exit(1)

    log.info(f"Config written successfully ({len(endpoints)} endpoint(s))")

    log.info("Config written — Gatus will detect file change and reload automatically")


if __name__ == "__main__":
    main()
