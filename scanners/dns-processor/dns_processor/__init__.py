import json
import argparse, sys
import asyncio
import os
import signal
import datetime
import traceback
import logging
from dotenv import load_dotenv
from arango import ArangoClient
from nats.aio.client import Client as NATS

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")
SUBSCRIBE_TO = os.getenv("SUBSCRIBE_TO")
PUBLISH_TO = os.getenv("PUBLISH_TO")
QUEUE_GROUP = os.getenv("QUEUE_GROUP")
SERVERLIST = os.getenv("NATS_SERVERS")
SERVERS = SERVERLIST.split(",")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)

import inspect


def line_number():
    return inspect.currentframe().f_back.f_lineno


def publish_results(results, scan_type, user_key):
    print(json.dumps(results, indent=2))


def process_results(results, domain_key, user_key, shared_id):
    timestamp = str(datetime.datetime.utcnow())
    tags = {"dmarc": [], "dkim": {}, "spf": []}

    # "dkim": {
    #   "error": "missing"
    # }
    valid_dkim = not results["dkim"].get("error")

    if valid_dkim:
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

    if results["dmarc"].get("error") == "missing":
        tags["dmarc"].append("dmarc2")
    else:

        # "valid": true,
        if results["dmarc"]["valid"]:
            tags["dmarc"].append("dmarc23")

        # Check P Policy Tag
        # "p": {
        #   "value": "reject",
        #   "explicit": true
        # },
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
        # "pct": {
        #   "value": 100,
        #   "explicit": true
        # },
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
        # "rua": {
        #   "value": [
        #     {
        #       "scheme": "mailto",
        #       "address": "dmarc@cyber.gc.ca",
        #       "size_limit": null
        #     }
        #   ],
        #   "explicit": true,
        #   "accepting": true
        # },
        rua_tags = results["dmarc"].get("tags", {}).get("rua", {}).get("value", [])

        if len(rua_tags) == 0:
            tags["dmarc"].append("dmarc12")

        for rua in rua_tags:
            # {
            #   "scheme": "mailto",
            #   "address": "dmarc@cyber.gc.ca",
            #   "size_limit": null
            # }
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
        # "ruf": {
        #   "value": [
        #     {
        #       "scheme": "mailto",
        #       "address": "dmarc@cyber.gc.ca",
        #       "size_limit": null
        #     }
        #   ],
        #   "explicit": true,
        #   "accepting": true
        # },
        ruf_tags = results["dmarc"].get("tags", {}).get("ruf", {}).get("value", [])

        if len(ruf_tags) == 0:
            tags["dmarc"].append("dmarc13")

        for ruf in ruf_tags:
            # {
            #   "scheme": "mailto",
            #   "address": "dmarc@cyber.gc.ca",
            #   "size_limit": null
            # }
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
        # "sp": {
        #   "value": "reject",
        #   "explicit": false
        # }
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

    if (results["spf"].get("error") == "missing") or (
        results["spf"].get("record", "null") == "null"
    ):
        tags["spf"].append("spf2")
    else:
        # "valid": true,
        if results["spf"]["valid"]:
            tags["spf"].append("spf12")

        # dependencies! Yikes!
        if valid_dkim:
            for selector, data in results["dkim"].items():
                if data.get("txt_record", None) is not None:
                    for key in data["txt_record"]:
                        if (key == "a" or key == "include") and "spf3" not in tags[
                            "spf"
                        ]:
                            tags["spf"].append("spf3")

        # "record": "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
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
        # "all": "neutral"
        all_tag = results["spf"].get("parsed", {}).get("all", None)
        # "record": "v=spf1 redirect=transition._spf.canada.ca",
        spf_record = results["spf"].get("record", None)

        if (all_tag is not None) and (spf_record is not None):
            if isinstance(all_tag, str) and isinstance(spf_record, str):
                all_tag = all_tag.lower()
                record_all_tag = spf_record[-4:].lower()

                # TODO: where is ?all
                # "record": "v=spf1 mx:canada.ca mx:mx.ssan.seg-egs.gc.ca ip4:205.193.86.223 ip4:205.193.117.44 ?all",
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
        # "dns_lookups": 3,
        dns_lookups = results["spf"].get("dns_lookups", 0)
        if dns_lookups > 10:
            tags["spf"].append("spf11")

        # Check for missing include
        # "include": [],
        include = results["spf"].get("parsed", {}).get("include", None)
        # "record": "v=spf1 redirect=transition._spf.canada.ca",
        record = results["spf"].get("record", None)

        if (include is not None) and (record is not None):
            for item in include:
                check_item = item.get("domain", None)
                if check_item is not None and f"include:{check_item}" not in record:
                    if not "spf13" in tags:
                        tags["spf"].append("spf13")

    # default
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
        "pPolicy": results["dmarc"].get("tags", {}).get("p", {}).get("value", None),
        "spPolicy": results["dmarc"].get("tags", {}).get("sp", {}).get("value", None),
        "pct": results["dmarc"].get("tags", {}).get("pct", {}).get("value", None),
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
    if not results["dkim"].get("error"):
        for selector in results["dkim"].keys():
            # store key_modulus as string, ArangoDB is not capable or storing numbers this size
            results["dkim"][selector]["public_key_modulus"] = str(results["dkim"][selector]["public_key_modulus"])
            keyModulus = results["dkim"][selector]["public_key_modulus"]
            # going to the database to find previous results by keyModulus
            # From the test data:
            # "selector1": {
            #     "t_value": "null",
            #     "txt_record": {
            #         "v": "DKIM1",
            #         "k": "rsa",
            #         "p": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3rvAQg9bl72tae1RFu4zdx1ZE4E8VUbQfxDcm/x6YW2eNRdGg9cRSgqSLXmj4I+HQQ4GHFItn7Hb0ubGt6AJYMCvygbnnwFX2Skt+w/msnXzQOYY+NR6DEfL/4kwiDaawcDumvD2JfEXD3yCyPBoZStg1wf0a9KgLQQNe4aMREQIDAQAB",
            #     },
            #     "public_key_value": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3rvAQg9bl72tae1RFu4zdx1ZE4E8VUbQfxDcm/x6YW2eNRdGg9cRSgqSLXmj4I+HQQ4GHFItn7Hb0ubGt6AJYMCvygbnnwFX2Skt+w/msnXzQOYY+NR6DEfL/4kwiDaawcDumvD2JfEXD3yCyPBoZStg1wf0a9KgLQQNe4aMREQIDAQAB",
            #     "key_size": 1024,
            #     "key_type": "rsa",
            #     "public_key_modulus": 128986835293314190150497987524189448449432921513193192948873532904302192799974922792602624695895630642090219163581382671361079596067726465810188870659566753252627341029040386217423692275583904625222303885358524296924420382485253455698862760166022132727095317896399159035250651155696560064015533460599431434513,
            #     "public_exponent": 65537,
            # }
            previous_dkim_results = db.collection("dkimResults").find(
                {"keyModulus": keyModulus}
            )

            # Has this public key been used before?
            # "dkim14": {
            #     "en": {
            #         "tagName": "P-duplicate",
            #         "guidance": "Public key used for multiple domains",
            # graph traversal across edges in dkimToDkimResults
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

                    # Check if public key is older than 1 year
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
                    selector: {
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

    # get spf status
    if "spf12" in tags["spf"]:
        spf_status = "pass"
    else:
        spf_status = "fail"

    # get dmarc status
    if "dmarc23" in tags["dmarc"]:
        dmarc_status = "pass"
    else:
        dmarc_status = "fail"

    # get dkim statuses
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
        else:
            dkim_statuses.append("pass")

    if len(dkim_statuses) == 0:
        dkim_status = "fail"
    elif any(i == "fail" for i in dkim_statuses):
        dkim_status = "fail"
    else:
        dkim_status = "pass"

    if user_key is None:
        try:
            dmarcEntry = db.collection("dmarc").insert(dmarcResults)

            spfEntry = db.collection("spf").insert(spfResults)

            dkimEntry = db.collection("dkim").insert({"timestamp": timestamp})

            for selector in dkimResults.keys():
                dkimResultsEntry = db.collection("dkimResults").insert(
                    dkimResults[selector]
                )
                db.collection("dkimToDkimResults").insert(
                    {
                        "_from": dkimEntry["_id"],
                        # Add timestamps to edges so that traversals can be
                        # constrained by time.
                        "timestamp": timestamp,
                        "_to": dkimResultsEntry["_id"],
                    }
                )

            domain = db.collection("domains").get({"_key": domain_key})
            db.collection("domainsDMARC").insert(
                {
                    "_from": domain["_id"],
                    "timestamp": timestamp,
                    "_to": dmarcEntry["_id"],
                }
            )
            db.collection("domainsSPF").insert(
                {"_from": domain["_id"], "timestamp": timestamp, "_to": spfEntry["_id"]}
            )
            db.collection("domainsDKIM").insert(
                {
                    "_from": domain["_id"],
                    "timestamp": timestamp,
                    "_to": dkimEntry["_id"],
                }
            )

            if domain.get("status", None) == None:
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
                "dkim": dkim_status,
                "dmarc": dmarc_status,
                "spf": spf_status,
            }.items():
                domain["status"][key] = val

            domain.update({"phase": phase})
            db.collection("domains").update(domain)

        except Exception as e:
            logging.error(
                f"Inserting processed results: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
            )
            return

        logging.info("DNS Scans inserted into database")
        return {
            "processed": {
                "domain": domain,
                "dkim": dkimResults,
                "dmarc": dmarcResults,
                "spf": spfResults,
            },
            "user_key": user_key,
            "shared_id": shared_id,
        }

    else:
        dmarcResults["phase"] = phase

        print("dmarc results:")
        publish_results(
            {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": dmarc_status,
                "results": dmarcResults,
            },
            "dmarc",
            user_key,
        )
        print("spf results:")
        publish_results(
            {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": spf_status,
                "results": spfResults,
            },
            "spf",
            user_key,
        )
        print("dkim results:")
        publish_results(
            {
                "sharedId": shared_id,
                "domainKey": domain_key,
                "status": dkim_status,
                "results": dkimResults,
            },
            "dkim",
            user_key,
        )
        logging.info("DNS Scans published to redis")


async def run(loop):
    parser = argparse.ArgumentParser()

    # e.g. nats-sub hello -s nats://127.0.0.1:4222
    parser.add_argument("subject", default="domains", nargs="?")
    parser.add_argument("-s", "--servers", default=[], action="append")
    parser.add_argument("-q", "--queue", default="https")
    parser.add_argument("--creds", default="")
    args = parser.parse_args()

    nc = NATS()

    async def error_cb(e):
        print(
            f"Nats error callback: {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )

    async def closed_cb():
        print("Connection to NATS is closed.")
        await asyncio.sleep(0.1)
        loop.stop()

    async def reconnected_cb():
        print(f"Connected to NATS at {nc.connected_url.netloc}...")

    async def subscribe_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        print(f"Received a message on '{subject} {reply}': {data}")
        payload = json.loads(msg.data)
        results = payload["results"]
        domain_key = payload["domain_key"]
        user_key = payload["user_key"]
        shared_id = payload["shared_id"]

        processed = process_results(results, domain_key, user_key, shared_id)
        await nc.publish(
            f"{PUBLISH_TO}.{domain_key}.dns.processed", json.dumps(processed).encode()
        )

    try:
        await nc.connect(
            loop=loop,
            error_cb=error_cb,
            closed_cb=closed_cb,
            reconnected_cb=reconnected_cb,
            servers=SERVERS,
        )
    except Exception as e:
        print(f"Error connecting to Nats: {e}")

    print(f"Connected to NATS at {nc.connected_url.netloc}...")

    def signal_handler():
        if nc.is_closed:
            return
        print("Disconnecting...")
        loop.create_task(nc.close())

    for sig in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, sig), signal_handler)

    await nc.subscribe(SUBSCRIBE_TO, QUEUE_GROUP, subscribe_handler)


def main():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
    try:
        loop.run_forever()
    finally:
        loop.close()


if __name__ == "__main__":
    main()
