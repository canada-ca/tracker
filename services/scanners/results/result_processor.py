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
import requests
import redis
from arango import ArangoClient
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from utils import formatted_dictionary, retrieve_tls_guidance

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)


def publish_results(results, scan_type, uuid):
    r.publish(f"scan/{scan_type}/{uuid}", json.dumps(results))

def process_https(results, domain_key, uuid, db):
    timestamp = str(datetime.datetime.utcnow())
    neutral_tags = []
    positive_tags = []
    negative_tags = []

    if results.get("missing", None) is not None:
        negative_tags.append("https2")
    else:
        # Implementation
        implementation = results.get("implementation", None)

        if implementation is not None:
            if isinstance(implementation, str):
                implementation = implementation.lower()

            if implementation == "downgrades https":
                negative_tags.append("https3")
            elif implementation == "bad chain":
                negative_tags.append("https4")
            elif implementation == "bad hostname":
                negative_tags.append("https5")

        # Enforced
        enforced = results.get("enforced", None)

        if enforced is not None:
            if isinstance(enforced, str):
                enforced = enforced.lower()

            if enforced == "moderate":
                negative_tags.append("https8")
            elif enforced == "weak":
                negative_tags.append("https7")
            elif enforced == "not enforced":
                negative_tags.append("https6")

        # HSTS
        hsts = results.get("hsts", None)

        if hsts is not None:
            if isinstance(hsts, str):
                hsts = hsts.lower()

                if hsts == "hsts max age too short":
                    negative_tags.append("https10")

                elif hsts == "no hsts":
                    negative_tags.append("https9")

            # HSTS Age
            hsts_age = results.get("hsts_age", None)

            if hsts_age is not None:
                if hsts_age < 31536000:
                    if "https9" not in negative_tags and "https10" not in negative_tags:
                        negative_tags.append("https10")

            # Preload Status
            preload_status = results.get("preload_status", None)

            if preload_status is not None:
                if isinstance(preload_status, str):
                    preload_status = preload_status.lower()

                    if preload_status == "hsts preload ready":
                        neutral_tags.append("https11")

                    elif preload_status == "hsts not preloaded":
                        neutral_tags.append("https12")

        else:
            negative_tags.append("https9")

        # Expired Cert
        expired_cert = results.get("expired_cert", False)

        if expired_cert is True:
            negative_tags.append("https13")

        # Self Signed Cert
        self_signed_cert = results.get("self_signed_cert", False)

        if self_signed_cert is True:
            negative_tags.append("https14")

        revocation_status = results.get("cert_revocation_status", "Unknown")

        if revocation_status == "Revoked":
            negative_tags.append("https15")
            
        elif revocation_status == "Unknown":
            neutral_tags.append("https16")

    httpsResults = {
        "timestamp": timestamp,
        "implementation": results.get("implementation", None),
        "enforced": results.get("enforced", None),
        "hsts": results.get("hsts", None),
        "hstsAge": results.get("hsts_age", None),
        "preloaded": results.get("preload_status", None),
        "rawJson": results,
        "neutralTags": neutral_tags,
        "positiveTags": positive_tags,
        "negativeTags": negative_tags,
        }

    if uuid is None:
        try:
            httpsEntry = db.collection("https").insert(httpsResults)
            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsHTTPS").insert(
                {"_from": domain["_id"], "_to": httpsEntry["_id"]}
            )

            if len(negative_tags) > 0:
                https_status = "fail"
            else:
                https_status = "pass"

            if domain.get("status", None) == None:
                domain.update(
                    {
                        "status": {
                            "https": "unknown",
                            "ssl": "unknown",
                            "dmarc": "unknown",
                            "dkim": "unknown",
                            "spf": "unknown",
                        }
                    }
                )
            domain["status"]["https"] = https_status
            db.collection("domains").update(domain)

        except Exception as e:
            logging.error(
                f"(HTTPS SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logging.info("HTTPS Scan inserted into database")

    else:
        publish_results(httpsResults, "https", uuid)
        logging.info("HTTPS Scan published to redis")


def process_ssl(results, guidance, domain_key, uuid, db):
    timestamp = str(datetime.datetime.utcnow())
    neutral_tags = []
    positive_tags = []
    negative_tags = []
    strong_ciphers = []
    acceptable_ciphers = []
    weak_ciphers = []
    strong_curves = []
    acceptable_curves = []
    weak_curves = []

    if results.get("missing", None) is not None:
        negative_tags.append("ssl2")
    else:
        for cipher in results["cipher_list"]:
            if "RC4" in cipher:
                negative_tags.append("ssl3")
            if "3DES" in cipher:
                negative_tags.append("ssl4")
            if cipher in (
                guidance["ciphers"]["1.2"]["recommended"]
                + guidance["ciphers"]["1.3"]["recommended"]
            ):
                strong_ciphers.append(cipher)
            elif cipher in (
                guidance["ciphers"]["1.2"]["sufficient"]
                + guidance["ciphers"]["1.3"]["sufficient"]
            ):
                acceptable_ciphers.append(cipher)
            else:
                weak_ciphers.append(cipher)

        for curve in results["supported_curves"]:
            if curve.lower() in guidance["curves"]["recommended"]:
                strong_curves.append(curve)
            elif curve.lower() in guidance["curves"]["sufficient"]:
                acceptable_curves.append(curve)
            else:
                weak_curves.append(curve)

        if results.get("signature_algorithm", None) is not None:
            for algorithm in (
                guidance["signature_algorithms"]["recommended"]
                + guidance["signature_algorithms"]["sufficient"]
            ):
                if results["signature_algorithm"].lower() in algorithm:
                    positive_tags.append("ssl5")
                    break

        if len(weak_ciphers) > 0:
            negative_tags.append("ssl6")

        if results["heartbleed"]:
            negative_tags.append("ssl7")

        if results["openssl_ccs_injection"]:
            negative_tags.append("ssl8")

    
    sslResults = {
        "timestamp": timestamp,
        "strong_ciphers": strong_ciphers,
        "acceptable_ciphers": acceptable_ciphers,
        "weak_ciphers": weak_ciphers,
        "strong_curves": strong_curves,
        "acceptable_curves": acceptable_curves,
        "weak_curves": weak_curves,
        "supports_ecdh_key_exchange": results.get(
            "supports_ecdh_key_exchange", False
        ),
        "heartbleed_vulnerable": results.get("heartbleed", False),
        "ccs_injection_vulnerable": results.get("openssl_ccs_injection", False),
        "rawJson": results,
        "neutralTags": neutral_tags,
        "positiveTags": positive_tags,
        "negativeTags": negative_tags,
    }
    
    if uuid is None:
        try:
            sslEntry = db.collection("ssl").insert(sslResults)
            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsSSL").insert(
                {"_from": domain["_id"], "_to": sslEntry["_id"]}
            )

            if len(negative_tags) > 0 or "ssl5" not in positive_tags:
                ssl_status = "fail"
            else:
                ssl_status = "pass"

            if domain.get("status", None) == None:
                domain.update(
                    {
                        "status": {
                            "https": "unknown",
                            "ssl": "unknown",
                            "dmarc": "unknown",
                            "dkim": "unknown",
                            "spf": "unknown",
                        }
                    }
                )
            domain["status"]["ssl"] = ssl_status
            db.collection("domains").update(domain)

        except Exception as e:
            logging.error(
                f"(SSL SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logging.info("SSL Scan inserted into database")

    else:
        publish_results(sslResults, "ssl", uuid)
        logging.info("SSL Scan published to redis")


def process_dns(results, domain_key, uuid, db):
    timestamp = str(datetime.datetime.utcnow())
    tags = {"dmarc": [], "dkim": {}, "spf": []}

    if results["dkim"].get("missing", None) is None:
        for selector in results["dkim"].keys():
            tags["dkim"][selector] = []
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
                tags["dkim"][selector].append("dkim2")
            elif v_tag is None or k_tag is None or p_tag is None:
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

    if (results["spf"].get("missing", None) is not None) or (
        results["spf"].get("record", "null") == "null"
    ):
        tags["spf"].append("spf2")
    else:
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

    phase = "not implemented"

    # CHECK IF DOMAIN IS IN "MAINTAIN" PHASE
    if "dmarc5" in tags["dmarc"] or "dmarc6" in tags["dmarc"]:
        if "dmarc7" in tags["dmarc"]:
            phase = "maintain"
        elif "dmarc8" in tags["dmarc"]:
            phase = "enforce"
    elif "dmarc4" in tags["dmarc"] and (
        "dmarc20" in tags["dmarc"] or "dmarc7" in tags["dmarc"]
    ):
        phase = "deploy"

    # DETERMINE TAG CONTEXT BASED ON PHASE (POSTIVE/NEUTRAL/NEGATIVE)
    guidance_tags = {
        "dmarc": {"neutralTags": [], "negativeTags": [], "positiveTags": []},
        "spf": {"neutralTags": [], "negativeTags": [], "positiveTags": []},
        "dkim": {},
    }

    for tag in ["dmarc2", "dmarc3", "dmarc11", "dmarc12", "dmarc15", "dmarc21"]:
        if tag in tags["dmarc"]:
            guidance_tags["dmarc"]["negativeTags"].append(tag)
    for tag in [
        "dmarc10",
        "dmarc13",
        "dmarc14",
        "dmarc16",
        "dmarc18",
        "dmarc19",
        "dmarc22",
    ]:
        if tag in tags["dmarc"]:
            guidance_tags["dmarc"]["neutralTags"].append(tag)
    if "dmarc23" in tags["dmarc"]:
        guidance_tags["dmarc"]["positiveTags"].append("dmarc23")

    if phase == "maintain":
        if "dmarc17" in tags["dmarc"]:
            guidance_tags["dmarc"]["negativeTags"].append("dmarc17")
        for tag in [
            "spf2",
            "spf3",
            "spf4",
            "spf5",
            "spf6",
            "spf7",
            "spf9",
            "spf10",
            "spf11",
        ]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["negativeTags"].append(tag)
        for tag in ["spf8", "spf12"]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["positiveTags"].append(tag)
        for selector in tags["dkim"].keys():
            guidance_tags["dkim"][selector] = {
                "neutralTags": [],
                "negativeTags": [],
                "positiveTags": [],
            }
            for tag in [
                "dkim2",
                "dkim3",
                "dkim4",
                "dkim5",
                "dkim6",
                "dkim7",
                "dkim8",
                "dkim9",
                "dkim10",
                "dkim11",
                "dkim12",
                "dkim13",
            ]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["negativeTags"].append(tag)
            for tag in ["dkim6", "dkim7"]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["positiveTags"].append(tag)
    elif phase == "enforce":
        if "dmarc17" in tags["dmarc"]:
            guidance_tags["dmarc"]["negativeTags"].append("dmarc17")
        for tag in [
            "spf2",
            "spf3",
            "spf4",
            "spf5",
            "spf6",
            "spf7",
            "spf9",
            "spf10",
            "spf11",
        ]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["negativeTags"].append(tag)
        for tag in ["spf7", "spf8", "spf12"]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["positiveTags"].append(tag)
        for selector in tags["dkim"].keys():
            guidance_tags["dkim"][selector] = {
                "neutralTags": [],
                "negativeTags": [],
                "positiveTags": [],
            }
            for tag in [
                "dkim2",
                "dkim3",
                "dkim4",
                "dkim5",
                "dkim6",
                "dkim7",
                "dkim8",
                "dkim9",
                "dkim10",
                "dkim11",
                "dkim12",
                "dkim13",
            ]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["negativeTags"].append(tag)
            for tag in ["dkim6", "dkim7"]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["positiveTags"].append(tag)
    else:
        if "dmarc17" in tags["dmarc"]:
            guidance_tags["dmarc"]["neutralTags"].append("dmarc17")
        for tag in ["spf5", "spf9", "spf11"]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["negativeTags"].append(tag)
        for tag in ["spf2", "spf3", "spf4", "spf6", "spf7", "spf8", "spf10"]:
            if tag in tags["spf"]:
                guidance_tags["spf"]["neutralTags"].append(tag)
        if "spf12" in tags["spf"]:
            guidance_tags["spf"]["positiveTags"].append("spf12")
        for selector in tags["dkim"].keys():
            guidance_tags["dkim"][selector] = {
                "neutralTags": [],
                "negativeTags": [],
                "positiveTags": [],
            }
            for tag in ["dkim5", "dkim8", "dkim9", "dkim11", "dkim12", "dkim13"]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["negativeTags"].append(tag)
            for tag in ["dkim2", "dkim3", "dkim4", "dkim6", "dkim7", "dkim10"]:
                if tag in tags["dkim"][selector]:
                    guidance_tags["dkim"][selector]["neutralTags"].append(tag)

    dmarcResults = {
        "timestamp": timestamp,
        "record": results["dmarc"].get("record", None),
        "pPolicy": results["dmarc"]
        .get("tags", {})
        .get("p", {})
        .get("value", None),
        "spPolicy": results["dmarc"]
        .get("tags", {})
        .get("sp", {})
        .get("value", None),
        "pct": results["dmarc"]
        .get("tags", {})
        .get("pct", {})
        .get("value", None),
        "rawJson": results["dmarc"],
        "neutralTags": guidance_tags["dmarc"]["neutralTags"],
        "positiveTags": guidance_tags["dmarc"]["positiveTags"],
        "negativeTags": guidance_tags["dmarc"]["negativeTags"],
    }

    spfRecord = results["spf"].get("record", None)
    if spfRecord is None:
        spfDefault = None
    else:
        spfDefault = spfRecord[-4:].lower()

    spfResults = {
        "timestamp": timestamp,
        "record": spfRecord,
        "lookups": results["spf"].get("dns_lookups", None),
        "spfDefault": spfDefault,
        "rawJson": results["spf"],
        "neutralTags": guidance_tags["spf"]["neutralTags"],
        "positiveTags": guidance_tags["spf"]["positiveTags"],
        "negativeTags": guidance_tags["spf"]["negativeTags"],
    }

    dkimResults = {}
    if results["dkim"].get("missing", None) is None:
        for selector in results["dkim"].keys():
            keyModulus = results["dkim"][selector]["public_key_modulus"]

            previous_dkim_results = db.collection("dkimResults").find(
                {"keyModulus": keyModulus}
            )

            for previous_dkim_result in previous_dkim_results:
                edges = db.collection("dkimToDkimResults").find(
                    {"_to": previous_dkim_result["_id"]}
                )
                for edge in edges:
                    previous_dkim = db.collection("dkim").get({"_id": edge["_from"]})

                    # Check if PK was used for another domain
                    previous_dkim_domain_query = db.collection("domainsDKIM").find(
                        {"_to": previous_dkim["_id"]}, limit=1
                    )
                    previous_dkim_domain = previous_dkim_domain_query.next()
                    if (previous_dkim_domain["_key"] != domain_key) and (
                        "dkim14" not in guidance_tags["dkim"][selector]["negativeTags"]
                    ):
                        guidance_tags["dkim"][selector]["negativeTags"].append("dkim14")

                    # Check if PK is older than 1 year
                    current_timestamp = datetime.datetime.strptime(
                        timestamp, "%Y-%m-%d %H:%M:%S.%f"
                    )
                    previous_timestamp = datetime.datetime.strptime(
                        previous_dkim["timestamp"], "%Y-%m-%d %H:%M:%S.%f"
                    )
                    for edge in edges:
                        previous_dkim = db.collection("dkim").get(
                            {"_id": edge["_from"]}
                        )

                        # Check if PK was used for another domain
                        previous_dkim_domain_query = db.collection("domainsDKIM").find(
                            {"_to": previous_dkim["_id"]}, limit=1
                        )
                        previous_dkim_domain = previous_dkim_domain_query.next()
                        if (previous_dkim_domain["_key"] != domain_key) and (
                            "dkim14"
                            not in guidance_tags["dkim"][selector]["negativeTags"]
                        ):
                            guidance_tags["dkim"][selector]["negativeTags"].append(
                                "dkim14"
                            )

                        # Check if PK is older than 1 year
                        current_timestamp = datetime.datetime.strptime(
                            timestamp, "%Y-%m-%d %H:%M:%S.%f"
                        )
                        previous_timestamp = datetime.datetime.strptime(
                            previous_dkim["timestamp"], "%Y-%m-%d %H:%M:%S.%f"
                        )

                        time_delta = current_timestamp - previous_timestamp

                        if (time_delta.total_seconds() > 31536000) and (
                            "dkim10"
                            not in guidance_tags["dkim"][selector]["negativeTags"]
                        ):
                            guidance_tags["dkim"][selector]["negativeTags"].append(
                                "dkim10"
                            )

            dkimResults.update(
                {
                    selector:
                        {
                            "record": results["dkim"][selector].get("txt_record", None),
                            "keyLength": results["dkim"][selector].get("key_size", None),
                            "keyModulus": keyModulus,
                            "rawJson": results["dkim"][selector],
                            "neutralTags": guidance_tags["dkim"][selector]["neutralTags"],
                            "positiveTags": guidance_tags["dkim"][selector]["positiveTags"],
                            "negativeTags": guidance_tags["dkim"][selector]["negativeTags"],
                        }
                }
            )

    if uuid is None:
        try:
            dmarcEntry = db.collection("dmarc").insert(dmarcResults)

            spfEntry = db.collection("spf").insert(spfResults)

            dkimEntry = db.collection("dkim").insert({"timestamp": timestamp})

            for selector in dkimResults.keys():
                dkimResultsEntry = db.collection("dkimResults").insert(dkimResults[selector])
                db.collection("dkimToDkimResults").insert(
                    {"_from": dkimEntry["_id"], "_to": dkimResultsEntry["_id"]}
                )

            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsDMARC").insert(
                {"_from": domain["_id"], "_to": dmarcEntry["_id"]}
            )
            db.collection("domainsSPF").insert(
                {"_from": domain["_id"], "_to": spfEntry["_id"]}
            )
            db.collection("domainsDKIM").insert(
                {"_from": domain["_id"], "_to": dkimEntry["_id"]}
            )

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

            if len(dkim_statuses) == 0:
                dkim_status = "fail"
            elif any(i == "fail" for i in dkim_statuses):
                dkim_status = "fail"
            else:
                dkim_status = "pass"

            if domain.get("status", None) == None:
                domain.update(
                    {
                        "status": {
                            "https": "unknown",
                            "ssl": "unknown",
                            "dmarc": "unknown",
                            "dkim": "unknown",
                            "spf": "unknown",
                        }
                    }
                )

            for key, val in {
                "dkim": dkim_status,
                "dmarc": dmarc_status,
                "spf": spf_status,
            }.items():
                domain["status"][key] = val

            domain.update({"phase": phase})
            db.collection("domains").update(domain)

        except Exception as e:
            logging.error(
                f"(DNS SCAN, TIME={datetime.datetime.utcnow()}) - An unknown exception occurred while attempting database insertion(s): {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logging.info("DNS Scans inserted into database")
        
    else:
        publish_results(dmarcResults, "dmarc", uuid)
        publish_results(spfResults, "spf", uuid)
        publish_results(dkimResults, "dkim", uuid)
        logging.info("DNS Scans published to redis")


def Server(
    db_host=DB_HOST,
    db_name=DB_NAME,
    db_user=DB_USER,
    db_pass=DB_PASS,
    db_port=DB_PORT,
    tls_guidance=retrieve_tls_guidance,
):

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

            if scan_type == "https":
                process_https(results, domain_key, uuid, db)
            elif scan_type == "ssl":
                guidance = tls_guidance()
                process_ssl(results, guidance, domain_key, uuid, db)
            else:
                process_dns(results, domain_key, uuid, db)

            return PlainTextResponse(
                f"{scan_type} results processed and inserted successfully (TIME={datetime.datetime.utcnow()})."
            )

        except Exception as e:
            msg = f"An error occurred while attempting to process results: ({type(e).__name__}: {str(e)}) \n\nFull traceback: {traceback.format_exc()}"
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
