import json
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

current_directory = os.path.dirname(os.path.realpath(__file__))
guidance_file = open(f"{current_directory}/dns-guidance.json")
guidance = json.load(guidance_file)


def process_dkim(dkim_results):
    dkim_err = dkim_results.get("error")
    dkim_tags = {}

    if dkim_err:
        return

    processed_dkim = {}

    for selector in dkim_results.keys():
        dkim_tags[selector] = []
        key_size = dkim_results[selector].get("key_size", None)
        key_type = dkim_results[selector].get("key_type", None)

        if key_size is None:
            dkim_tags[selector].append("dkim9")
        elif key_type is None:
            dkim_tags[selector].append("dkim9")
        else:
            if key_size >= 4096 and key_type == "rsa":
                dkim_tags[selector].append("dkim8")
            elif key_size >= 2048 and key_type == "rsa":
                dkim_tags[selector].append("dkim7")
            elif key_size == 1024 and key_type == "rsa":
                dkim_tags[selector].append("dkim6")
            elif key_size < 1024 and key_type == "rsa":
                dkim_tags[selector].append("dkim5")
            else:
                dkim_tags[selector].append("dkim9")

        if key_type != "rsa":
            dkim_tags[selector].append("dkim11")

        # Dkim value invalid
        # Check if v and p exist in txt_record
        v_tag = dkim_results[selector].get("parsed", {}).get("v", None)
        p_tag = dkim_results[selector].get("parsed", {}).get("p", None)

        if v_tag is None and p_tag is None:
            dkim_tags[selector].append("dkim2")
        elif v_tag is None or p_tag is None:
            dkim_tags[selector].append("dkim12")

        # Testing Enabled
        t_enabled = dkim_results[selector].get("parsed", {}).get("t", "")
        if t_enabled.lower() == "y":
            dkim_tags[selector].append("dkim13")

        processed_dkim[selector] = {
            "positive_tags": [],
            "negative_tags": [],
            "neutral_tags": []
        }
        for tag in dkim_tags[selector]:
            if tag in guidance["dkim"]["pass"]:
                processed_dkim[selector]["positive_tags"].append(tag)
            if tag in guidance["dkim"]["fail"]:
                processed_dkim[selector]["negative_tags"].append(tag)
            if tag in guidance["dkim"]["info"]:
                processed_dkim[selector]["neutral_tags"].append(tag)

    # get dkim statuses
    dkim_statuses = []

    for selector in processed_dkim.keys():
        if len(processed_dkim[selector]["negative_tags"]) > 0:
            dkim_statuses.append("fail")
        else:
            dkim_statuses.append("pass")

    dkim_status = "pass" if all([False if status == "fail" else True for status in dkim_statuses]) and len(
        processed_dkim) > 0 else "fail"

    return processed_dkim, dkim_status


def process_spf(spf_results):
    spf_err = spf_results.get("error")

    if spf_err:
        return

    spf_tags = []

    if (spf_results.get("error") == "missing") or (
        spf_results.get("record", "null") == "null"
    ):
        spf_tags.append("spf2")
        return spf_tags

    # "valid": true,
    if spf_results["valid"]:
        spf_tags.append("spf12")

    # Check all tag
    # "all": "neutral"
    all_tag = spf_results.get("parsed", {}).get("all", None)
    # "record": "v=spf1 redirect=transition._spf.canada.ca",
    spf_record = spf_results.get("record", None)

    if (all_tag is not None) and (spf_record is not None):
        if isinstance(all_tag, str) and isinstance(spf_record, str):
            all_tag = all_tag.lower()

            # "record": "v=spf1 mx:canada.ca mx:mx.ssan.seg-egs.gc.ca ip4:205.193.86.223 ip4:205.193.117.44 ?all",
            match all_tag:
                case "pass":
                    spf_tags.append("spf5")
                case "neutral":
                    spf_tags.append("spf6")
                case "fail":
                    spf_tags.append("spf8")
                case "softfail":
                    spf_tags.append("spf7")
                case _:
                    raise ValueError(f"Unexpected 'all' tag state: {all_tag}")

    # Look up limit check
    # "dns_lookups": 3,
    dns_lookups = spf_results.get("dns_lookups", 0)
    if dns_lookups > 10:
        spf_tags.append("spf11")

    processed_spf = {
        "positive_tags": [],
        "negative_tags": [],
        "neutral_tags": []
    }

    for tag in spf_tags:
        if tag in guidance["spf"]["pass"]:
            processed_spf["positive_tags"].append(tag)
        if tag in guidance["spf"]["fail"]:
            processed_spf["negative_tags"].append(tag)
        if tag in guidance["spf"]["info"]:
            processed_spf["neutral_tags"].append(tag)

    spf_status = "fail"
    if "spf12" in processed_spf["positive_tags"] and len(processed_spf["negative_tags"]) == 0:
        spf_status = "pass"

    return processed_spf, spf_status


def process_dmarc(dmarc_results):
    dmarc_err = dmarc_results.get("error")

    if dmarc_err:
        return

    dmarc_tags = []

    if dmarc_results.get("error") == "missing":
        dmarc_tags.append("dmarc2")
        return dmarc_tags

    # "valid": true,
    if dmarc_results["valid"]:
        dmarc_tags.append("dmarc23")

    # Check P Policy Tag
    # "p": {
    #   "value": "reject",
    #   "explicit": true
    # },
    p_policy_tag = dmarc_results.get("tags", {}).get("p", {}).get("value", None)

    if p_policy_tag is not None:
        if isinstance(p_policy_tag, str):
            p_policy_tag = p_policy_tag.lower()

        if p_policy_tag == "missing":
            dmarc_tags.append("dmarc3")
        elif p_policy_tag == "none":
            dmarc_tags.append("dmarc4")
        elif p_policy_tag == "quarantine":
            dmarc_tags.append("dmarc5")
        elif p_policy_tag == "reject":
            dmarc_tags.append("dmarc6")

    # Check PCT Tag
    # "pct": {
    #   "value": 100,
    #   "explicit": true
    # },
    pct_tag = dmarc_results.get("tags", {}).get("pct", {}).get("value", None)

    if pct_tag is not None:
        if isinstance(pct_tag, str):
            pct_tag = pct_tag.lower()
            if pct_tag == "invalid":
                dmarc_tags.append("dmarc9")
            elif pct_tag == "none":
                dmarc_tags.append("dmarc20")
        elif isinstance(pct_tag, int):
            if pct_tag == 100:
                dmarc_tags.append("dmarc7")
            elif 100 > pct_tag > 0:
                dmarc_tags.append("dmarc8")
            else:
                dmarc_tags.append("dmarc21")

    # Check RUA _tags
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
    rua_tags = dmarc_results.get("tags", {}).get("rua", {}).get("value", [])

    if len(rua_tags) == 0:
        dmarc_tags.append("dmarc12")

    for rua in rua_tags:
        # {
        #   "scheme": "mailto",
        #   "address": "dmarc@cyber.gc.ca",
        #   "size_limit": null
        # }
        for key, val in rua.items():
            if key == "address" and val == "dmarc@cyber.gc.ca":
                dmarc_tags.append("dmarc10")

        # Check if external reporting arrangement has been authorized
        rua_accepting = rua.get("accepting", None)

        if rua_accepting is not None:
            if rua_accepting is False or rua_accepting == "undetermined":
                if "dmarc15" not in dmarc_tags:
                    dmarc_tags.append("dmarc15")

    # Check RUF _tags
    # "ruf": {
    #   "value": [
    #     {
    #       "scheme": "mailto",
    #       "size_limit": null
    #     }
    #   ],
    #   "explicit": true,
    #   "accepting": true
    # },
    ruf_tags = dmarc_results.get("tags", {}).get("ruf", {}).get("value", [])

    if len(ruf_tags) == 0:
        dmarc_tags.append("dmarc13")

    for ruf in ruf_tags:
        # {
        #   "scheme": "mailto",
        #   "address": "dmarc@cyber.gc.ca",
        #   "size_limit": null
        # }
        for key, val in ruf.items():
            if key == "address" and val == "dmarc@cyber.gc.ca":
                dmarc_tags.append("dmarc11")

        # Check if external reporting arrangement has been authorized
        ruf_accepting = ruf.get("accepting", None)

        if ruf_accepting is not None:
            if ruf_accepting is False or ruf_accepting == "undetermined":
                if "dmarc15" not in dmarc_tags:
                    dmarc_tags.append("dmarc15")

    if "dmarc15" not in dmarc_tags and (len(ruf_tags) > 0 or len(rua_tags) > 0):
        dmarc_tags.append("dmarc14")

    # Check SP tag
    # "sp": {
    #   "value": "reject",
    #   "explicit": false
    # }
    sp_tag = dmarc_results.get("tags", {}).get("sp", {}).get("value", None)

    if sp_tag is not None:
        if isinstance(sp_tag, str):
            sp_tag = sp_tag.lower()

        if sp_tag == "missing":
            dmarc_tags.append("dmarc16")
        elif sp_tag == "none":
            dmarc_tags.append("dmarc17")
        elif sp_tag == "quarantine":
            dmarc_tags.append("dmarc18")
        elif sp_tag == "reject":
            dmarc_tags.append("dmarc19")

    processed_dmarc = {
        "positive_tags": [],
        "negative_tags": [],
        "neutral_tags": []
    }

    for tag in dmarc_tags:
        if tag in guidance["dmarc"]["pass"]:
            processed_dmarc["positive_tags"].append(tag)
        if tag in guidance["dmarc"]["fail"]:
            processed_dmarc["negative_tags"].append(tag)
        if tag in guidance["dmarc"]["info"]:
            processed_dmarc["neutral_tags"].append(tag)

    dmarc_status = "fail"
    if "dmarc10" in processed_dmarc["positive_tags"] and "dmarc23" in processed_dmarc["positive_tags"] and len(
        processed_dmarc["negative_tags"]) == 0:
        dmarc_status = "pass"

    return processed_dmarc, dmarc_status


def process_results(results):
    dkim_tags, dkim_status = process_dkim(results["dkim"])

    dmarc_tags, dmarc_status = process_dmarc(results["dmarc"])

    spf_tags, spf_status = process_spf(results["spf"])

    if dmarc_tags:
        all_dmarc_tags = dmarc_tags["negative_tags"] + dmarc_tags["neutral_tags"] + dmarc_tags["positive_tags"]
    else:
        all_dmarc_tags = None

    # Check DMARC phase (https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna)
    phase = "not implemented"

    rua_addresses = results["dmarc"].get("tags", {}).get("rua", {}).get("value", [])
    if any(tag in all_dmarc_tags for tag in ["dmarc4", "dmarc5", "dmarc6"]) and len(rua_addresses) > 0:
        phase = "assess"

        if dkim_status and spf_status:
            phase = "deploy"

            if any(tag in all_dmarc_tags for tag in ["dmarc5", "dmarc6"]):
                phase = "maintain"

    dmarc_results = {
        "record": results["dmarc"].get("record", None),
        "p_policy": results["dmarc"].get("tags", {}).get("p", {}).get("value", None),
        "sp_policy": results["dmarc"].get("tags", {}).get("sp", {}).get("value", None),
        "pct": results["dmarc"].get("tags", {}).get("pct", {}).get("value", None),
        "phase": phase,
        "neutral_tags": dmarc_tags["neutral_tags"],
        "positive_tags": dmarc_tags["positive_tags"],
        "negative_tags": dmarc_tags["negative_tags"],
    }

    spf_record = results["spf"].get("record", None)
    spf_results = {
        "record": spf_record,
        "lookups": results["spf"].get("dns_lookups", None),
        "spf_default": results["spf"].get("parsed", {}).get("all", None),
        "neutral_tags": spf_tags["neutral_tags"],
        "positive_tags": spf_tags["positive_tags"],
        "negative_tags": spf_tags["negative_tags"],
    }

    dkim_results = {}
    if not results["dkim"].get("error"):
        for selector in results["dkim"].keys():
            if results["dkim"][selector].get("error", None):
                dkim_results[selector] = results["dkim"][selector]
                continue

            dkim_results[selector] = {
                "record": results["dkim"][selector].get("record", None),
                "parsed": results["dkim"][selector].get("parsed", None),
                "key_length": results["dkim"][selector].get("key_size", None),
                "key_type": results["dkim"][selector].get("key_type", None),
                "public_exponent": results["dkim"][selector].get("public_exponent", None),
                "neutral_tags": dkim_tags[selector]["neutral_tags"],
                "positive_tags": dkim_tags[selector]["positive_tags"],
                "negative_tags": dkim_tags[selector]["negative_tags"],
            }

            # store key_modulus as string, ArangoDB is not capable or storing numbers this size
            key_modulus = results["dkim"][selector].get("public_key_modulus", None)
            if key_modulus:
                dkim_results[selector]["key_modulus"] = str(key_modulus)

    timestamp = str(datetime.datetime.utcnow())

    return {
        "timestamp": timestamp,
        "domain": results["domain"],
        "base_domain": results["base_domain"],
        "record_exists": results["record_exists"],
        "rcode": results["rcode"],
        "resolve_chain": results["resolve_chain"],
        "resolve_ips": results["resolve_ips"],
        "cname_record": results["cname_record"],
        "mx_records": results["mx_records"],
        "ns_records": results["ns_records"],
        "dmarc": {"status": dmarc_status, "results": dmarc_results},
        "spf": {"status": spf_status, "results": spf_results},
        "dkim": {"status": dkim_status, "results": dkim_results}
    }
