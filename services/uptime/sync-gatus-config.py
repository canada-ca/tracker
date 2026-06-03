import logging
import os
import shutil
import sys
import tempfile
from dotenv import load_dotenv

import yaml
from arango import ArangoClient

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


def build_endpoint(doc):
    domain = doc.get("domain")

    return {
        "name": domain,
        "url": f"https://{domain}",
        "interval": "5m",
        "conditions": [
            "[STATUS] == any(200, 429)",  # prevents rate limiting from triggering alerts
            "[RESPONSE_TIME] < 10000",
        ],
        "alerts": [{"type": "custom"}],
    }


def build_config(endpoints):
    return {
        "web": {"port": 8080, "path-prefix": "/uptime"},
        "storage": {"type": "memory"},
        "metrics": False,
        "endpoints": endpoints,
        "alerting": build_alerting(),
    }


def main():
    log.info(f"Connecting to ArangoDB...")
    try:
        client = ArangoClient(hosts=ARANGO_URL)
        db = client.db(
            ARANGO_DATABASE, username=ARANGO_USERNAME, password=ARANGO_PASSWORD
        )
        db.version()  # validate connection
    except Exception as e:
        log.error(f"ArangoDB connection failed: {e}")
        sys.exit(1)

    log.info("Querying high availability services...")
    try:
        cursor = db.aql.execute(
            "FOR d IN domains FILTER d.highAvailability == true RETURN d"
        )
        docs = list(cursor)
    except Exception as e:
        log.error(f"ArangoDB query failed: {e}")
        sys.exit(1)

    log.info(f"Query returned {len(docs)} document(s)")

    endpoints = [build_endpoint(doc) for doc in docs]
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
