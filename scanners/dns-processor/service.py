import asyncio
import datetime
import functools
import json
import logging
import nats
import os
import re
import signal
import sys
import traceback
from arango import ArangoClient
from dotenv import load_dotenv

from dns_processor.dns_processor import process_results
from notify.send_mx_diff_email_alerts import send_mx_diff_email_alerts

load_dotenv()

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
)
logger = logging.getLogger()

NAME = os.getenv("NAME", "dns-processor")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def to_camelcase(string):
    string = string
    # remove underscore and uppercase following letter
    string = re.sub("_([a-z])", lambda match: match.group(1).upper(), string)
    # keep numbers seperated with hyphen
    string = re.sub("([0-9])_([0-9])", r"\1-\2", string)
    # remove underscore before numbers
    string = re.sub("_([0-9])", r"\1", string)
    # convert snakecase to camel
    string = re.sub("_([a-z])", lambda match: match.group(1).upper(), string)
    return string


def snake_to_camel(d):
    if isinstance(d, str):
        return d
    if isinstance(d, list):
        return [snake_to_camel(entry) for entry in d]
    if isinstance(d, dict):
        return {
            to_camelcase(a): snake_to_camel(b) if isinstance(b, (dict, list)) else b
            for a, b in d.items()
        }


def mx_record_diff(processed_results):
    domain = process_results.get("domain")
    new_mx = processed_results.get("mx_records").get("hosts")
    diff_reason = ""
    mx_record_diff = False
    # fetch most recent scan of domain
    last_mx = (
        db.aql.execute(
            """
            FOR scan IN dns
                FILTER scan.domain == @domain
                SORT scan.timestamp DESC
                LIMIT 1
                RETURN scan
            """,
            bind_vars={"domain": domain},
        )
        .next()
        .get("mx_records")
        .get("hosts")
    )
    # compare mx_records to most recent scan
    # if different, set mx_records_diff to True
    # check number of hosts

    if len(new_mx) != len(last_mx):
        if len(new_mx) > len(last_mx):
            diff_reason = "host_added"
            mx_record_diff = True
        else:
            # print("host removed")
            diff_reason = "host_removed"
            mx_record_diff = True
    else:
        # check hostnames
        hostnames_new = []
        hostnames_last = []
        for i in range(len(new_mx)):
            hostnames_new.append(new_mx[i]["hostname"])
            hostnames_last.append(last_mx[i]["hostname"])

        if set(hostnames_new) != set(hostnames_last):
            diff_reason = "host_changed"
            mx_record_diff = True
        else:
            # check hostname preferences and addresses
            for i in range(len(new_mx)):
                # find hostname in last_mx
                for j in range(len(last_mx)):
                    if new_mx[i]["hostname"] == last_mx[j]["hostname"]:
                        # check preference
                        if new_mx[i]["preference"] != last_mx[j]["preference"]:
                            diff_reason = "preference_changed"
                            mx_record_diff = True
                            break
                        # check addresses
                        if set(new_mx[i]["addresses"]) != set(last_mx[j]["addresses"]):
                            diff_reason = "address_changed"
                            mx_record_diff = True
                            break

    # send alerts if true
    if mx_record_diff:
        send_mx_diff_email_alerts(
            domain=domain, diff_reason=diff_reason, logger=logger, db=db
        )

    processed_results["mx_records"].update({"diff": mx_record_diff})
    return processed_results


async def run(loop):
    async def error_cb(error):
        logger.error(error)

    async def closed_cb():
        logger.info("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    async def reconnected_cb():
        logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    nc = await nats.connect(
        error_cb=error_cb,
        closed_cb=closed_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
    )

    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    async def subscribe_handler(msg):
        await asyncio.sleep(0.01)
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        logger.info(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)

        results = payload.get("results")
        domain_key = payload.get("domain_key")
        user_key = payload.get("user_key")
        shared_id = payload.get("shared_id")

        processed_results = process_results(results)
        processed_results = mx_record_diff(processed_results)

        dmarc_status = processed_results.get("dmarc").get("status")
        spf_status = processed_results.get("spf").get("status")
        dkim_status = processed_results.get("dkim").get("status")

        rcode = processed_results.get("rcode", None)

        if user_key is None:
            try:
                dns_entry = db.collection("dns").insert(
                    snake_to_camel(processed_results)
                )

                domain = db.collection("domains").get({"_key": domain_key})
                db.collection("domainsDNS").insert(
                    {
                        "_from": domain["_id"],
                        "timestamp": processed_results["timestamp"],
                        "_to": dns_entry["_id"],
                    }
                )

                web_entry = db.collection("web").insert(
                    {
                        "timestamp": str(datetime.datetime.now().astimezone()),
                        "domain": processed_results["domain"],
                    }
                )
                db.collection("domainsWeb").insert(
                    {
                        "_from": domain["_id"],
                        "timestamp": processed_results["timestamp"],
                        "_to": web_entry["_id"],
                    }
                )

                if domain.get("status", None) is None:
                    domain.update(
                        {
                            "status": {
                                "https": "unknown",
                                "ssl": "unknown",
                                "dmarc": "unknown",
                                "dkim": "unknown",
                                "spf": "unknown",
                                "certificates": "fail",
                                "ciphers": "fail",
                                "curves": "fail",
                                "hsts": "fail",
                                "policy": "fail",
                                "protocols": "fail",
                            }
                        }
                    )

                for key, val in {
                    "dmarc": dmarc_status,
                    "spf": spf_status,
                    "dkim": dkim_status,
                }.items():
                    domain["status"][key] = val

                dmarc_phase = processed_results.get("dmarc").get("phase")
                wildcard_sibling = processed_results.get("wildcard_sibling")

                domain.update({"phase": dmarc_phase})
                domain.update({"wildcardSibling": wildcard_sibling})
                domain.update({"rcode": rcode})
                domain.update({"webScanPending": True})

                # If we have no IPs, we can't do web scans. Set all web statuses to info
                if not results.get("resolve_ips", None):
                    domain.update({"webScanPending": False})
                    domain["status"].update(
                        {
                            "https": "info",
                            "ssl": "info",
                            "certificates": "info",
                            "ciphers": "info",
                            "curves": "info",
                            "hsts": "info",
                            "policy": "info",
                            "protocols": "info",
                        }
                    )

                db.collection("domains").update(domain)

                for ip in results.get("resolve_ips", None) or []:
                    web_scan = db.collection("webScan").insert(
                        {"status": "pending", "ipAddress": ip}
                    )
                    db.collection("webToWebScans").insert(
                        {
                            "_from": web_entry["_id"],
                            "_to": web_scan["_id"],
                        }
                    )

                    await nc.publish(
                        f"{PUBLISH_TO}.{domain_key}.web",
                        json.dumps(
                            {
                                "user_key": user_key,
                                "domain": domain["domain"],
                                "domain_key": domain_key,
                                "shared_id": shared_id,
                                "ip_address": ip,
                                "web_scan_key": web_scan["_key"],
                            }
                        ).encode(),
                    )

            except Exception as e:
                logging.error(
                    f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
                )
                return

            logging.info(
                f"DNS Scans inserted into database: {json.dumps(processed_results)}"
            )

    await nc.subscribe(subject=SUBSCRIBE_TO, queue=QUEUE_GROUP, cb=subscribe_handler)

    def ask_exit(sig_name):
        logger.error(f"Got signal {sig_name}: exit")
        if nc.is_closed:
            return
        loop.create_task(nc.close())

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name), functools.partial(ask_exit, signal_name)
        )


def main():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    main()
