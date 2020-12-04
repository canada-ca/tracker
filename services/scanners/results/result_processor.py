import os
import re
import sys
import time
import json
import logging
import traceback
import emoji
import random
import asyncio
import datetime
from arango import ArangoClient
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from utils import formatted_dictionary

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def process_https(results):
    tags = []

    if results.get("missing", None) is not None:
        tags.append("https2")
        return tags

    # Implementation
    implementation = results.get("implementation", None)

    if implementation is not None:
        if isinstance(implementation, str):
            implementation = implementation.lower()

        if implementation == "downgrades https":
            tags.append("https3")
        elif implementation == "bad chain":
            tags.append("https4")
        elif implementation == "bad hostname":
            tags.append("https5")

    # Enforced
    enforced = results.get("enforced", None)

    if enforced is not None:
        if isinstance(enforced, str):
            enforced = enforced.lower()

        if enforced == "moderate":
            tags.append("https8")
        elif enforced == "weak":
            tags.append("https7")
        elif enforced == "not enforced":
            tags.append("https6")

    # HSTS
    hsts = results.get("hsts", None)

    if hsts is not None and hsts.lower() != "no hsts":
        if isinstance(hsts, str):
            hsts = hsts.lower()

        if hsts == "hsts max age too short":
            tags.append("https10")
        elif hsts == "no hsts":
            tags.append("https9")

        # HSTS Age
        hsts_age = results.get("hsts_age", None)

        if hsts_age is not None:
            if hsts_age < 31536000 and "https" not in tags:
                tags.append("https10")

    # Preload Status
    preload_status = results.get("preload_status", None)

    if preload_status is not None:
        if isinstance(preload_status, str):
            preload_status = preload_status.lower()

        if preload_status == "hsts preload ready":
            tags.append("https11")
        elif preload_status == "hsts not preloaded":
            tags.append("https12")

    # Expired Cert
    expired_cert = results.get("expired_cert", False)

    if expired_cert is True:
        tags.append("https13")

    # Self Signed Cert
    self_signed_cert = results.get("https", {}).get("self_signed_cert", False)

    if self_signed_cert is True:
        tags.append("https14")

    return tags


def process_ssl(results):
    tags = []

    if results.get("missing", None) is not None:
        tags.append("ssl2")
        return tags

    # SSL-rc4
    if results["rc4"]:
        tags.append("ssl3")

    # SSL-3des
    if results["3des"]:
        tags.append("ssl4")

    # Acceptable certificate (e.g. SHA256, SHA384, AEAD)
    if results["acceptable_certificate"]:
        tags.append("ssl5")

    if len(results["weak_ciphers"]) > 0:
        tags.append("ssl6")

    # Heartbleed
    if results["heartbleed"]:
        tags.append("ssl7")

    # openssl ccs injection
    if results["openssl_ccs_injection"]:
        tags.append("ssl8")

    return tags


def process_dns(results):
    tags = {"dmarc": [], "dkim": {}, "spf": []}

    for selector in results.get("dkim", {}).keys():
        tags["dkim"][selector] = []
        if results["dkim"][selector].get("missing", None) is not None:
            tags["dkim"][selector].append("dkim2")
        else:
            key_size = results["dkim"][selector].get("key_size", None)
            key_type = results["dkim"][selector].get("key_type", None)

            if key_size is None:
                tags["dkim"][selector].append("dkim9")
            elif key_type is None:
                tags["dkim"][selector].append("dkim9")
            else:
                if key_size >= 4096 and key_type == "rsa":
                    tags["dkim"][selector].append("dkim8")
                elif key_size >= 2048 and key_type == "rsa":
                    tags["dkim"][selector].append("dkim7")
                elif key_size == 1024 and key_type == "rsa":
                    tags["dkim"][selector].append("dkim6")
                elif key_size < 1024 and key_type == "rsa":
                    tags["dkim"][selector].append("dkim5")
                else:
                    tags["dkim"][selector].append("dkim9")

            # Invalid Crypto
            invalid_crypto = (
                results["dkim"][selector].get("txt_record", {}).get("k", None)
            )

            if invalid_crypto is not None:
                # if k != rsa
                if invalid_crypto != "rsa":
                    tags["dkim"][selector].append("dkim11")

            # Dkim value invalid
            # Check if v, k, and p exist in txt_record
            v_tag = results["dkim"][selector].get("txt_record", {}).get("v", None)
            k_tag = results["dkim"][selector].get("txt_record", {}).get("k", None)
            p_tag = results["dkim"][selector].get("txt_record", {}).get("p", None)

            if v_tag is None and k_tag is None and p_tag is None:
                tags["dkim"][selector].append("dkim12")

            # Testing Enabled
            t_enabled = results["dkim"][selector].get("t_value", "")
            if t_enabled.lower() == "true":
                tags["dkim"][selector].append("dkim13")

    if results["dmarc"].get("missing", None) is not None:
        tags["dmarc"].append("dmarc2")
    else:

        if results["dmarc"]["valid"]:
            tags["dmarc"].append("dmarc23")

        # Check P Policy Tag
        p_policy_tag = results["dmarc"].get("tags", {}).get("p", {}).get("value", None)

        if p_policy_tag is not None:
            if isinstance(p_policy_tag, str):
                p_policy_tag = p_policy_tag.lower()

            if p_policy_tag == "missing":
                tags["dmarc"].append("dmarc3")
            elif p_policy_tag == "none":
                tags["dmarc"].append("dmarc4")
            elif p_policy_tag == "quarantine":
                tags["dmarc"].append("dmarc5")
            elif p_policy_tag == "reject":
                tags["dmarc"].append("dmarc6")

        # Check PCT Tag
        pct_tag = results["dmarc"].get("tags", {}).get("pct", {}).get("value", None)

        if pct_tag is not None:
            if isinstance(pct_tag, str):
                pct_tag = pct_tag.lower()
                if pct_tag == "invalid":
                    tags["dmarc"].append("dmarc9")
                elif pct_tag == "none":
                    tags["dmarc"].append("dmarc20")
            elif isinstance(pct_tag, int):
                if pct_tag == 100:
                    tags["dmarc"].append("dmarc7")
                elif 100 > pct_tag > 0:
                    tags["dmarc"].append("dmarc8")
                else:
                    tags["dmarc"].append("dmarc21")

        # Check RUA Tags
        rua_tags = results["dmarc"].get("tags", {}).get("rua", {}).get("value", [])

        if len(rua_tags) == 0:
            tags["dmarc"].append("dmarc12")

        for rua in rua_tags:
            for key, val in rua.items():
                if key == "address" and val == "dmarc@cyber.gc.ca":
                    tags["dmarc"].append("dmarc10")

            # Check if external reporting arrangement has been authorized
            rua_accepting = rua.get("accepting", None)

            if rua_accepting is not None:
                if rua_accepting is False:
                    if "dmarc22" not in tags["dmarc"]:
                        tags["dmarc"].append("dmarc22")
                    if "dmarc15" not in tags["dmarc"]:
                        tags["dmarc"].append("dmarc15")

        # Check RUF Tags
        ruf_tags = results["dmarc"].get("tags", {}).get("ruf", {}).get("value", [])

        if len(ruf_tags) == 0:
            tags["dmarc"].append("dmarc13")

        for ruf in ruf_tags:
            for key, val in ruf.items():
                if key == "address" and val == "dmarc@cyber.gc.ca":
                    tags["dmarc"].append("dmarc11")

            # Check if external reporting arrangement has been authorized
            ruf_accepting = ruf.get("accepting", None)

            if ruf_accepting is not None:
                if ruf_accepting is False:
                    if "dmarc15" not in tags["dmarc"]:
                        tags["dmarc"].append("dmarc15")

        if "dmarc15" not in tags["dmarc"] and (len(ruf_tags) > 0 or len(rua_tags) > 0):
            tags["dmarc"].append("dmarc14")

        # Check SP tag
        sp_tag = results["dmarc"].get("tags", {}).get("sp", {}).get("value", None)

        if sp_tag is not None:
            if isinstance(sp_tag, str):
                sp_tag = sp_tag.lower()

            if sp_tag == "missing":
                tags["dmarc"].append("dmarc16")
            elif sp_tag == "none":
                tags["dmarc"].append("dmarc17")
            elif sp_tag == "quarantine":
                tags["dmarc"].append("dmarc18")
            elif sp_tag == "reject":
                tags["dmarc"].append("dmarc19")

    if results["spf"].get("missing", None) is not None:
        tags["spf"].append("spf2")
        return tags

    if results["spf"]["valid"]:
        tags["spf"].append("spf12")

    for selector, data in results["dkim"].items():
        if data.get("txt_record", None) is not None:
            for key in data["txt_record"]:
                if (key == "a" or key == "include") and "spf3" not in tags["spf"]:
                    tags["spf"].append("spf3")

    dmarc_record = results["dmarc"].get("record", None)
    if dmarc_record is not None:
        if (
            ("include:" in dmarc_record)
            or ("a:" in dmarc_record)
            or ("all" in dmarc_record)
        ):
            if "spf3" not in tags:
                tags["spf"].append("spf3")

    # Check all tag
    all_tag = results["spf"].get("parsed", {}).get("all", None)
    spf_record = results["spf"].get("record", None)

    if (all_tag is not None) and (spf_record is not None):
        if isinstance(all_tag, str) and isinstance(spf_record, str):
            all_tag = all_tag.lower()
            record_all_tag = spf_record[-4:].lower()

            if record_all_tag != "-all" and record_all_tag != "~all":
                tags["spf"].append("spf10")
            elif all_tag == "missing":
                tags["spf"].append("spf4")
            elif all_tag == "allow":
                tags["spf"].append("spf5")
            elif all_tag == "neutral":
                tags["spf"].append("spf6")
            elif all_tag == "redirect":
                tags["spf"].append("spf9")
            elif all_tag == "fail":
                if record_all_tag == "-all":
                    tags["spf"].append("spf8")
                elif record_all_tag == "~all":
                    tags["spf"].append("spf7")

    # Look up limit check
    dns_lookups = results["spf"].get("dns_lookups", 0)
    if dns_lookups > 10:
        tags["spf"].append("spf11")

    # Check for missing include
    include = results["spf"].get("parsed", {}).get("include", None)
    record = results["spf"].get("record", None)

    if (include is not None) and (record is not None):
        for item in include:
            check_item = item.get("domain", None)
            if check_item is not None and f"include:{check_item}" not in record:
                if not "spf13" in tags:
                    tags["spf"].append("spf13")

    return tags


def insert_https(report, tags, domain_key, db):
    timestamp = str(datetime.datetime.utcnow())
    try:
        httpsEntry = db.collection("https").insert(
            {
                "timestamp": timestamp,
                "implementation": report.get("implementation", None),
                "enforced": report.get("enforced", None),
                "hsts": report.get("hsts", None),
                "hstsAge": report.get("hsts_age", None),
                "preloaded": report.get("preload_status", None),
                "rawJson": report,
                "guidanceTags": tags,
            }
        )
        domain = db.collection("domains").get({"_key": domain_key})
        db.collection("domainsHTTPS").insert({"_from": domain["_id"], "_to": httpsEntry["_id"]})

        if any(
            i
            in [
                "https2",
                "https3",
                "https4",
                "https5",
                "https6",
                "https7",
                "https8",
                "https9",
                "https10",
                "https11",
                "https12",
                "https13",
                "https14",
            ]
            for i in tags
        ):
            https_status = "fail"
        else:
            https_status = "pass"

        domain["status"]["https"] = https_status
        db.collection("domains").update_match(
            {"_key": domain_key}, {"status": domain["status"]}
        )

    except Exception as e:
        logging.error(
            f"(HTTPS SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return

    logging.info("HTTPS Scan inserted into database")


def insert_ssl(report, tags, domain_key, db):
    timestamp = str(datetime.datetime.utcnow())
    try:
        sslEntry = db.collection("ssl").insert(
            {
                "timestamp": timestamp,
                "rawJson": report,
                "guidanceTags": tags,
            }
        )
        domain = db.collection("domains").get({"_key": domain_key})
        db.collection("domainsSSL").insert({"_from": domain["_id"], "_to": sslEntry["_id"]})

        if any(i in ["ssl2", "ssl3", "ssl4", "ssl6", "ssl7", "ssl8"] for i in tags):
            ssl_status = "fail"
        elif "ssl5" in tags:
            ssl_status = "pass"

        domain["status"]["ssl"] = ssl_status
        db.collection("domains").update_match(
            {"_key": domain_key}, {"status": domain["status"]}
        )

    except Exception as e:
        logging.error(
            f"(SSL SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return

    logging.info("SSL Scan inserted into database")


def insert_dns(report, tags, domain_key, db):
    timestamp = str(datetime.datetime.utcnow())
    try:
        dmarcEntry = db.collection("dmarc").insert(
            {
                "timestamp": timestamp,
                "record": report["dmarc"].get("record", None),
                "pPolicy": report["dmarc"]
                .get("tags", {})
                .get("p", {})
                .get("value", None),
                "spPolicy": report["dmarc"]
                .get("tags", {})
                .get("sp", {})
                .get("value", None),
                "pct": report["dmarc"]
                .get("tags", {})
                .get("pct", {})
                .get("value", None),
                "rawJson": report["dmarc"],
                "guidanceTags": tags["dmarc"],
            }
        )
        spfRecord = report["spf"].get("record", None)
        if spfRecord is None:
            spfDefault = None
        else:
            spfDefault = spfRecord[-4:].lower()
        spfEntry = db.collection("spf").insert(
            {
                "timestamp": timestamp,
                "record": spfRecord,
                "lookups": report["spf"].get("dns_lookups", None),
                "spfDefault": spfDefault,
                "rawJson": report["spf"],
                "guidanceTags": tags["spf"],
            }
        )

        db.collection("dkim").insert({"timestamp": timestamp})
        for selector in report["dkim"].keys():
            keyModulus = report["dkim"][selector]["public_key_modulus"]

            previous_dkim_results = db.collection("dkimResults").find({"keyModulus": keyModulus})

            for previous_dkim_result in previous_dkim_results:
                edges = db.collection("dkimToDkimResults").find({"_to": previous_dkim_result["_id"]})
                for edge in edges:
                    previous_dkim = db.collection("dkim").get({"_id": edge["_from"]})

                    # Check if PK was used for another domain
                    previous_dkim_domain_query = db.collection("domainsDKIM").find({"_to": previous_dkim["_id"]}, limit=1)
                    previous_dkim_domain = previous_dkim_domain_query.next()
                    if (previous_dkim_domain["_key"] != domain_key) and ("dkim14" not in tags["dkim"][selector]):
                        tags["dkim"][selector].append("dkim14")

                    # Check if PK is older than 1 year
                    current_timestamp = datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S.%f')
                    previous_timestamp = datetime.datetime.strptime(previous_dkim["timestamp"], '%Y-%m-%d %H:%M:%S.%f')

                    time_delta = current_timestamp - previous_timestamp

                    if (time_delta.total_seconds > 31536000) and ("dkim10" not in tags["dkim"][selector]):
                        tags["dkim"][selector].append("dkim10")

            dkimResultsEntry = db.collection("dkimResults").insert(
                {
                    "record": report["dkim"][selector].get("txt_record", None),
                    "keyLength": report["dkim"][selector].get("key_size", None),
                    "keyModulus": keyModulus,
                    "rawJson": report["dkim"][selector],
                    "guidanceTags": tags["dkim"][selector],
                }
            )
            db.collection("dkimToDkimResults").insert({"_from": dkimEntry["_id"], "_to": dkimResultsEntry["_id"]})

        domain = db.collection("domains").get({"_key": domain_key})
        db.collection("domainsDMARC").insert({"_from": domain["_id"], "_to": dmarcEntry["_id"]})
        db.collection("domainsSPF").insert({"_from": domain["_id"], "_to": spfEntry["_id"]})
        db.collection("domainsDKIM").insert({"_from": domain["_id"], "_to": dkimEntry["_id"]})

        if "spf12" in tags["spf"]:
            spf_status = "pass"
        else:
            spf_status = "fail"

        if "dmarc23" in tags["dmarc"]:
            dmarc_status = "pass"
        else:
            dmarc_status = "fail"

        dkim_statuses = []
        for selector in tags["dkim"].keys():
            if any(
                i
                in [
                    "dkim2",
                    "dkim3",
                    "dkim4",
                    "dkim5",
                    "dkim6",
                    "dkim9",
                    "dkim11",
                    "dkim12",
                ]
                for i in tags["dkim"][selector]
            ):
                dkim_statuses.append("fail")
            elif all(i in ["dkim7", "dkim8"] for i in tags["dkim"][selector]):
                dkim_statuses.append("pass")

        if any(i == "fail" for i in dkim_statuses):
            dkim_status = "fail"
        else:
            dkim_status = "pass"

        for key, val in {
            "dkim": dkim_status,
            "dmarc": dmarc_status,
            "spf": spf_status,
        }.items():
            domain["status"][key] = val
        db.collection("domains").update_match(
            {"_key": domain_key}, {"status": domain["status"]}
        )

    except Exception as e:
        logging.error(
            f"(DNS SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return

    logging.info("DNS Scans inserted into database")


INSERT = {"https": insert_https, "ssl": insert_ssl, "dns": insert_dns}

PROCESS = {"https": process_https, "ssl": process_ssl, "dns": process_dns}


def Server(db_host=DB_HOST, db_name=DB_NAME, db_user=DB_USER, db_pass=DB_PASS, db_port=DB_PORT):

    # Establish DB connection
    connection_string = f"http://{db_host}:{db_port}"
    arango_client = ArangoClient(hosts=connection_string)
    db = arango_client.db(db_name, username=db_user, password=db_pass)

    async def process(result_request):
        logging.info(f"Results received.")
        payload = await result_request.json()
        try:
            payload_dict = formatted_dictionary(str(payload))
            try:
                results = payload_dict["results"]
                scan_type = payload_dict["scan_type"]
                uuid = payload_dict["uuid"]
                domain_key = payload_dict["domain_key"]
                logging.info(
                    f"Results received for {scan_type} scan (TIME={datetime.datetime.utcnow()})"
                )
            except KeyError:
                msg = f"Invalid result format received: {str(payload_dict)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            tags = PROCESS[scan_type](results)

            INSERT[scan_type](results, tags, domain_key, db)

            return PlainTextResponse(
                f"{scan_type} results processed and inserted successfully TIME={datetime.datetime.utcnow()})."
            )

        except Exception as e:
            msg = f"An error occurred while attempting to process results: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            return PlainTextResponse(msg)

    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))

    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route("/", process, methods=["POST"]),
    ]

    starlette_app = Starlette(
        debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown]
    )

    return starlette_app


if all(i is not None for i in [DB_USER, DB_HOST, DB_PASS, DB_PORT]):
    app = Server()
