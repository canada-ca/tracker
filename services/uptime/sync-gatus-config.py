import logging
import os
import shutil
import signal
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
GATUS_CONFIG_PATH = os.getenv("GATUS_CONFIG_PATH", "/config/config.yaml")


def build_endpoint(doc):
    domain = doc.get("domain")
    interval = doc.get("checkInterval", "30s")
    expected_status = doc.get("expectedStatus", 200)
    response_time_ms = doc.get("responseTimeThresholdMs", 10000)

    return {
        "name": domain,
        "url": f"https://{domain}",
        "interval": interval,
        "conditions": [
            f"[STATUS] == {expected_status}",
            f"[RESPONSE_TIME] < {response_time_ms}",
        ],
        "alerts": [
            {
                "type": "custom",
                "description": "Service is down or degraded",
                "failure-threshold": 3,
                "success-threshold": 2,
            }
        ],
    }


def build_config(endpoints):
    return {
        "web": {"port": 8080, "path-prefix": "/uptime"},
        "storage": {"type": "memory"},
        "metrics": False,
        "endpoints": endpoints,
    }


def find_gatus_pid():
    proc_dir = "/proc"
    for pid in os.listdir(proc_dir):
        if not pid.isdigit():
            continue
        try:
            with open(f"{proc_dir}/{pid}/cmdline", "rb") as f:
                cmdline = f.read().decode("utf-8", errors="replace")
            if "gatus" in cmdline.lower():
                return int(pid)
        except (OSError, IOError):
            continue
    return None


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

    log.info(
        "Running query: FOR d IN domains FILTER d.highAvailability == true RETURN d"
    )
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

    pid = find_gatus_pid()
    if pid:
        log.info(f"Sending SIGHUP to Gatus (pid={pid})")
        try:
            os.kill(pid, signal.SIGHUP)
        except ProcessLookupError:
            log.warning(f"Gatus process {pid} not found — may have restarted")
        except PermissionError as e:
            log.error(f"Permission denied sending SIGHUP: {e}")
            sys.exit(1)
    else:
        log.warning(
            "Gatus process not found in /proc — skipping SIGHUP (init run or process not started yet)"
        )


if __name__ == "__main__":
    main()
