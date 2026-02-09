import asyncio
import datetime
import ipaddress
import json
import logging
import time
from dataclasses import dataclass

from concurrent.futures import ThreadPoolExecutor

import nats
import os
import re
import signal
import sys
import traceback
from arango import ArangoClient, DocumentUpdateError
from dotenv import load_dotenv
from nats.js import JetStreamContext
from nats.js.api import RetentionPolicy, AckPolicy, ConsumerConfig
from nats.errors import TimeoutError as NatsTimeoutError

from dns_processor.dns_processor import process_results
from notify.send_mx_diff_email_alerts import send_mx_diff_email_alerts

load_dotenv()

LOGGER_LEVEL = os.getenv("LOGGER_LEVEL", "INFO")

logger_level = logging.getLevelName(LOGGER_LEVEL)
if not isinstance(logger_level, int):
    print(f"Invalid logger level: {LOGGER_LEVEL}")
    sys.exit(1)

# Split logging to stdout and stderr
# DEBUG and INFO to stdout
# WARNING and above to stderr
h1 = logging.StreamHandler(sys.stdout)
h1.setLevel(logging.DEBUG)
h1.addFilter(lambda record: record.levelno <= logging.INFO)
h2 = logging.StreamHandler(sys.stderr)
h2.setLevel(logging.WARNING)

logging.basicConfig(
    level=logger_level,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
    handlers=[h1, h2],
)
logger = logging.getLogger(__name__)

NAME = os.getenv("NAME", "dns-processor")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")

CNAME_MONITOR_ONLY_LIST = os.getenv("CNAME_MONITOR_ONLY_LIST", "").split(",")
SERVICE_ACCOUNT_EMAIL = os.getenv("SERVICE_ACCOUNT_EMAIL")

SCAN_THREAD_COUNT = int(os.getenv("SCAN_THREAD_COUNT", 1))

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


def check_mx_diff(processed_results, domain_id):
    new_mx = processed_results.get("mx_records").get("hosts")
    mx_record_diff = False
    # fetch most recent scan of domain
    last_mx_cursor = db.aql.execute(
        """
            FOR v, e IN 1..1 OUTBOUND @domain_id domainsDNS
                SORT v.timestamp DESC
                LIMIT 1
                RETURN v
            """,
        bind_vars={"domain_id": domain_id},
    )
    # if no previous scan, return False as we can't compare records
    if last_mx_cursor.empty():
        return False

    last_mx = last_mx_cursor.next().get("mxRecords", {}).get("hosts", [])

    # compare mx_records to most recent scan
    # if different, set mx_records_diff to True
    # check number of hosts
    if len(new_mx) != len(last_mx):
        mx_record_diff = True
    else:
        # check hostnames
        hostnames_new = []
        hostnames_last = []
        for i in range(len(new_mx)):
            hostnames_new.append(new_mx[i]["hostname"])
            hostnames_last.append(last_mx[i]["hostname"])

        if set(hostnames_new) != set(hostnames_last):
            mx_record_diff = True

    # fetch domain org, filter by verified and externally managed
    domain_org_cursor = db.aql.execute(
        """
            FOR v, e IN 1..1 INBOUND @domain_id claims
                FILTER v.verified == true
                LIMIT 1
                RETURN v
            """,
        bind_vars={"domain_id": domain_id},
    )
    # if no org, return early
    if domain_org_cursor.empty():
        return mx_record_diff

    domain_org = domain_org_cursor.next()

    # send alerts if true
    if mx_record_diff and os.getenv("ALERT_SUBS"):
        current_val = []
        for host in new_mx:
            current_val.append(f"{host['hostname']} {host['preference']}")
        if len(current_val) == 0:
            current_val = "null"
        else:
            current_val = ";".join(current_val)

        prev_val = []
        for host in last_mx:
            prev_val.append(f"{host['hostname']} {host['preference']}")

        if len(prev_val) == 0:
            prev_val = "null"
        else:
            prev_val = ";".join(prev_val)

        send_mx_diff_email_alerts(
            domain=processed_results.get("domain"),
            record_type="MX",
            org=domain_org,
            prev_val=prev_val,
            current_val=current_val,
        )

    return mx_record_diff


def is_cname_target(resolve_chain, domains):
    # Check if any CNAME record in the resolve chain points to a domain in the provided list
    for rrset in resolve_chain:
        for record in rrset:
            record_parts = record.split(" ")
            if len(record_parts) >= 5 and record_parts[3] == "CNAME":
                record_target = record_parts[4].strip(".")
                if record_target in domains:
                    return True
    return False


def process_msg(msg):
    subject = msg.subject
    reply = msg.reply
    data = msg.data.decode()
    logger.info(f"Received a message on '{subject} {reply}': {data}")
    payload = json.loads(msg.data)

    scan_results = payload.get("results")
    domain_key = payload.get("domain_key")
    user_key = payload.get("user_key")
    shared_id = payload.get("shared_id")

    try:
        domain = db.collection("domains").get({"_key": domain_key})
    except Exception as e:
        logger.error(
            f"Error while fetching domain for received message: {msg}: {str(e)}"
        )
        return

    scan_results["sends_email"] = domain.get("sendsEmail", "unknown")

    processed_results = process_results(scan_results)
    try:
        if processed_results.get("mx_records") is not None:
            mx_record_diff = check_mx_diff(
                processed_results=processed_results,
                domain_id=f"domains/{domain_key}",
            )
            processed_results["mx_records"].update({"diff": mx_record_diff})
    except Exception as e:
        logger.error(f"Checking MX diff for received message {msg}: {str(e)}")

    dmarc_location = processed_results.get("dmarc").get("location")
    dmarc_status = processed_results.get("dmarc").get("status")
    spf_status = processed_results.get("spf").get("status")
    dkim_status = processed_results.get("dkim").get("status")

    rcode = processed_results.get("rcode", None)

    formatted_scan_data_array = []

    if user_key is None:
        try:
            dns_entry = db.collection("dns").insert(snake_to_camel(processed_results))
            domain.update({"latestDnsScan": dns_entry["_id"]})

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
                            "certificates": "info",
                            "ciphers": "info",
                            "curves": "info",
                            "dkim": "info",
                            "dmarc": "info",
                            "hsts": "info",
                            "https": "info",
                            "protocols": "info",
                            "spf": "info",
                            "ssl": "info",
                        }
                    }
                )

            if "dmarcLocation" not in domain.keys():
                domain.update({"dmarcLocation": dmarc_location})
            elif domain.get("dmarcLocation", None) != dmarc_location:
                domain.update({"dmarcLocation": dmarc_location})

            for key, val in {
                "dmarc": dmarc_status,
                "spf": spf_status,
                "dkim": dkim_status,
            }.items():
                domain["status"][key] = val

            dmarc_phase = processed_results.get("dmarc").get("phase")
            wildcard_sibling = processed_results.get("wildcard_sibling")
            wildcard_entry = processed_results.get("wildcard_entry")

            domain.update({"phase": dmarc_phase})
            domain.update({"wildcardSibling": wildcard_sibling})
            domain.update({"wildcardEntry": wildcard_entry})
            domain.update({"rcode": rcode})
            domain.update(
                {"hasCyberRua": processed_results.get("dmarc").get("has_cyber_rua")}
            )

            dns_negative_tags = (
                processed_results.get("spf", {"negative_tags": []}).get("negative_tags", []) +
                processed_results.get("dmarc", {"negative_tags": []}).get("negative_tags", []) +
                processed_results.get("dkim", {"negative_tags": []}).get("negative_tags", [])
            )
            domain.update({"negativeTags": {"dns": dns_negative_tags}})

            domain.update({"webScanPending": True})

            all_ips_private = True

            for ip in scan_results.get("resolve_ips", []) or []:
                try:
                    is_private_ip = ipaddress.ip_address(ip).is_private
                except ValueError:
                    logger.error(
                        f"Invalid IP address: {ip} for received message: {msg}"
                    )
                    continue

                all_ips_private = all_ips_private and is_private_ip

                web_scan_status = "pending" if not is_private_ip else "complete"

                web_scan = db.collection("webScan").insert(
                    {
                        "status": web_scan_status,
                        "ipAddress": ip,
                        "isPrivateIp": is_private_ip,
                    }
                )
                db.collection("webToWebScans").insert(
                    {
                        "_from": web_entry["_id"],
                        "_to": web_scan["_id"],
                    }
                )

                if not is_private_ip:
                    formatted_scan_data_array.append(
                        {
                            "user_key": user_key,
                            "domain": domain["domain"],
                            "domain_key": domain_key,
                            "shared_id": shared_id,
                            "ip_address": ip,
                            "web_scan_key": web_scan["_key"],
                        }
                    )

            # If we have no IPs, we can't do web scans. Set all web statuses to info
            if not scan_results.get("resolve_ips", None) or all_ips_private:
                domain.update({"webScanPending": False})
                domain.update({"blocked": False})
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

            del domain["_rev"]
            try:
                db.collection("domains").update(domain)
            except DocumentUpdateError as e:
                error_str = str(e)
                start_retry = time.monotonic()
                document_updated = False
                # Retry for 5 seconds in case another process is updating the same document
                while time.monotonic() - start_retry < 5:
                    try:
                        db.collection("domains").update(domain)
                        document_updated = True
                        break
                    except DocumentUpdateError as while_e:
                        time.sleep(0.1)
                        error_str = str(while_e)
                        continue
                if not document_updated:
                    logger.error(
                        f"Error while updating domain after retrying for received message: {msg}: {error_str}"
                    )

            if processed_results.get("cname_record") is not None and CNAME_MONITOR_ONLY_LIST:
                try:
                    # Use resolve chain instead of CNAME as some domains have CNAMEs that point to other CNAMEs before reaching the final target domain
                    is_cname_target_in_monitor_only_list = is_cname_target(
                        resolve_chain=processed_results.get("resolve_chain", []),
                        domains=CNAME_MONITOR_ONLY_LIST,
                    )

                    if is_cname_target_in_monitor_only_list:
                        # Get current claim asset states of domain
                        approved_state_claims_cursor = db.aql.execute(
                            """
                                FOR v, e IN 1..1 INBOUND @domain_id claims
                                    FILTER v.verified == true
                                    FILTER e.assetState == "approved"
                                    RETURN e
                            """,
                            bind_vars={"domain_id": domain["_id"]},
                        )
                        if approved_state_claims_cursor.empty():
                            logger.debug(
                                f"No approved claims for domain with CNAME in monitor-only list for received message: {msg}"
                            )
                        else:
                            approved_state_claims = [claim for claim in approved_state_claims_cursor]
                            for claim in approved_state_claims:
                                try:
                                    logger.info(f"Domain with CNAME in monitor-only list has approved claim, updating claim state to monitor-only for claim: {claim}")
                                    claim["assetState"] = "monitor-only"
                                    db.collection("claims").update(claim)

                                    insert_activity = {
                                        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[
                                                         :-3
                                                     ]
                                                     + "Z",
                                        "initiatedBy": {
                                            "id": "dns-processor",
                                            "userName": SERVICE_ACCOUNT_EMAIL,
                                            "role": "service",
                                        },
                                        "target": {
                                            "resource": domain["domain"],
                                            "updatedProperties": [
                                                {
                                                    "name": "assetState",
                                                    "oldValue": "approved",
                                                    "newValue": "monitor-only",
                                                }
                                            ],
                                            "organization": {"id": claim["_from"].split("/")[1]},
                                            "resourceType": "domain",
                                        },
                                        "action": "update",
                                        "reason": None,
                                    }
                                    db.collection("auditLogs").insert(insert_activity)

                                except Exception as e:
                                    logger.error(
                                        f"Error while processing claim with approved state for domain with CNAME in monitor-only list for received message: {msg}: {str(e)}"
                                    )
                                    continue

                except Exception as e:
                    logger.error(
                        f"Error while parsing CNAME record for received message: {msg}: {str(e)}"
                    )

        except Exception as e:
            logger.error(
                f"Error while inserting processed results for received message: {msg}: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logger.info(
            f"DNS Scans inserted into database: {json.dumps(processed_results)}"
        )

        return formatted_scan_data_array


async def run():
    loop = asyncio.get_running_loop()

    @dataclass
    class Context:
        should_exit: bool = False
        sub: JetStreamContext.PullSubscription = None

    context = Context()

    async def error_cb(error):
        logger.error(f"Uncaught error in callback: {error}")

    async def reconnected_cb():
        logger.info(f"Reconnected to NATS at {nc.connected_url.netloc}...")
        # Ensure jetstream consumer is still present
        context.sub = await js.pull_subscribe(**pull_subscribe_options)
        logger.info("Re-subscribed to NATS...")

    nc = await nats.connect(
        error_cb=error_cb,
        reconnected_cb=reconnected_cb,
        servers=SERVERS,
        name=NAME,
    )
    js = nc.jetstream()
    logger.info(f"Connected to NATS at {nc.connected_url.netloc}...")

    pull_subscribe_options = {
        "stream": "SCANS",
        "subject": "scans.dns_scanner_results",
        "durable": "dns_processor",
        "config": ConsumerConfig(
            ack_policy=AckPolicy.EXPLICIT,
            max_deliver=-1,
            max_waiting=100_000,
            ack_wait=90,
        ),
    }

    context.sub = await js.pull_subscribe(**pull_subscribe_options)

    async def ask_exit(sig_name):
        if context.should_exit is True:
            return
        logger.error(f"Got signal {sig_name}: exit")
        context.should_exit = True

    for signal_name in {"SIGINT", "SIGTERM"}:
        loop.add_signal_handler(
            getattr(signal, signal_name),
            lambda: asyncio.create_task(ask_exit(signal_name)),
        )

    async def handle_finished_scan(fut, original_msg, semaphore):
        try:
            await fut
            res = fut.result()
            if isinstance(res, Exception):
                logger.error(
                    f"Uncaught scan error for received message: {original_msg}: {res}"
                )
                return

            scan_data_array = res
            logger.debug(f"Scan data array: {scan_data_array}")
            for scan_data in scan_data_array:
                logger.debug(f"Publishing results: {scan_data}")
                try:
                    original_headers = original_msg.headers
                    subject = "scans.dns_processor_results"
                    if original_headers.get("priority") == "high":
                        subject = "scans.dns_processor_results_priority"
                    await js.publish(
                        stream="SCANS",
                        subject=subject,
                        payload=json.dumps(scan_data).encode(),
                        headers=original_headers,
                    )
                except TimeoutError as e:
                    logger.error(
                        f"Timeout while publishing results: {scan_data}: for received message: {original_msg}: {e} \n\nFull traceback: {traceback.format_exc()}"
                    )
                    return

            try:
                logger.debug(f"Acknowledging message: {original_msg}")
                await original_msg.ack()
            except Exception as e:
                logger.error(
                    f"Error while acknowledging message for received message: {original_msg}: {e}"
                )
        finally:
            logger.debug("Releasing semaphore...")
            try:
                semaphore.release()
            except Exception as e:
                logger.error(
                    f"Error while releasing semaphore for received message: {original_msg}: {e}"
                )

    sem = asyncio.BoundedSemaphore(SCAN_THREAD_COUNT)

    with ThreadPoolExecutor() as executor:
        while True:
            if context.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            await sem.acquire()

            if context.should_exit:
                break
            if nc.is_closed:
                logger.error("Connection to NATS is closed.")
                break

            try:
                logger.debug("Fetching message...")
                msgs = await context.sub.fetch(batch=1, timeout=1)
                msg = msgs[0]
                logger.debug(f"Received message: {msg}")
            except NatsTimeoutError:
                logger.debug("No messages available...")
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )
                continue

            try:
                future = loop.run_in_executor(executor, process_msg, msg)
                loop.create_task(
                    handle_finished_scan(fut=future, original_msg=msg, semaphore=sem)
                )
            except Exception as e:
                logger.error(f"Error while queueing scan, releasing semaphore: {e}")
                try:
                    sem.release()
                except Exception as e:
                    logger.error(
                        f"Error while releasing semaphore for received message: {msg}: {e}"
                    )

    logger.info("Service is shutting down...")

    await nc.flush()
    logger.info("Flushed NATS connection")
    await nc.close()
    logger.info("Closed NATS connection...")


if __name__ == "__main__":
    asyncio.run(run())
