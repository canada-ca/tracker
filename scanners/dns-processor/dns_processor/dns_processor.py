import json
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

current_directory = os.path.dirname(os.path.realpath(__file__))
guidance_file = open(f"{current_directory}/dns-guidance.json")
guidance = json.load(guidance_file)


def get_dkim_tag_status(selector_tag_list, sends_email):
    selector_tags = {}

    dkim_tags = {"positive_tags": [], "negative_tags": [], "neutral_tags": []}

    if sends_email == "false":
        dkim_tags["neutral_tags"].append("dkim17")
        return dkim_tags, selector_tags, "info"
    elif sends_email == "unknown" or sends_email is None:
        dkim_tags["neutral_tags"].append("dkim18")
        return dkim_tags, selector_tags, "info"
    elif sends_email == "true":
        dkim_tags["neutral_tags"].append("dkim19")

    # get dkim statuses
    dkim_statuses = []

    for dkim_selector, tags in selector_tag_list.items():
        selector_tags[dkim_selector] = {
            "status": "fail",
            "positive_tags": [],
            "negative_tags": [],
            "neutral_tags": [],
        }

        for tag in tags:
            if tag in guidance["dkim"]["pass"]:
                selector_tags[dkim_selector]["positive_tags"].append(tag)
            if tag in guidance["dkim"]["fail"]:
                selector_tags[dkim_selector]["negative_tags"].append(tag)
            if tag in guidance["dkim"]["info"]:
                selector_tags[dkim_selector]["neutral_tags"].append(tag)

        if len(selector_tags[dkim_selector]["negative_tags"]) > 0:
            dkim_statuses.append("fail")
            selector_tags[dkim_selector]["status"] = "fail"
        else:
            dkim_statuses.append("pass")
            selector_tags[dkim_selector]["status"] = "pass"

    dkim_status = (
        "pass"
        if all([False if status == "fail" else True for status in dkim_statuses])
        and len(selector_tags) > 0
        else "fail"
    )

    if len(selector_tags) == 0:
        dkim_tags["negative_tags"].append("dkim16")

    return dkim_tags, selector_tags, dkim_status


def process_dkim(dkim_results, sends_email):
    dkim_err = dkim_results.get("error")
    dkim_tags = {}

    if dkim_err or sends_email != "true":
        return get_dkim_tag_status(dkim_tags, sends_email)

    for selector in dkim_results:
        dkim_tags[selector] = []

        if dkim_results[selector].get("record", None) is None:
            dkim_tags[selector].append("dkim2")
            continue

        key_size = dkim_results[selector].get("key_size", None)
        key_type = dkim_results[selector].get("key_type", None)

        if key_size is not None and key_type is not None:
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

        if key_type is not None and key_type != "rsa":
            dkim_tags[selector].append("dkim11")

        # Dkim value invalid
        # Check if v and p exist in txt_record
        v_tag = dkim_results[selector].get("parsed", {}).get("v", None)
        p_tag = dkim_results[selector].get("parsed", {}).get("p", None)

        if p_tag is None or p_tag == "":
            dkim_tags[selector].append("dkim15")

        # Testing Enabled
        t_enabled = dkim_results[selector].get("parsed", {}).get("t", "")
        if t_enabled.lower() == "y":
            dkim_tags[selector].append("dkim13")

    return get_dkim_tag_status(dkim_tags, sends_email)


def process_spf(spf_results):
    def get_spf_tag_status(tags):
        processed_spf = {"positive_tags": [], "negative_tags": [], "neutral_tags": []}
        for tag in tags:
            if tag in guidance["spf"]["pass"]:
                processed_spf["positive_tags"].append(tag)
            if tag in guidance["spf"]["fail"]:
                processed_spf["negative_tags"].append(tag)
            if tag in guidance["spf"]["info"]:
                processed_spf["neutral_tags"].append(tag)

        if (
            "spf12" in processed_spf["positive_tags"]
            and len(processed_spf["negative_tags"]) == 0
        ):
            spf_status = "pass"
        else:
            spf_status = "fail"

        return processed_spf, spf_status

    spf_tags = []

    if (spf_results.get("error") == "missing") or (
        spf_results.get("record", None) is None
    ):
        spf_tags.append("spf2")
        return get_spf_tag_status(spf_tags)

    # Check all tag (renamed as spf_default)
    # "spf_default": "neutral"
    all_tag = spf_results.get("parsed", {}).get("spf_default", None)
    # "record": "v=spf1 redirect=transition._spf.canada.ca",
    spf_record = spf_results.get("record", None)

    if (all_tag is not None) and (spf_record is not None):
        if isinstance(all_tag, str) and isinstance(spf_record, str):
            all_tag = all_tag.lower()

            # "record": "v=spf1 mx:canada.ca mx:mx.ssan.seg-egs.gc.ca ip4:205.193.86.223 ip4:205.193.117.44 ?all",
            match all_tag:
                case None:
                    spf_tags.append("spf4")
                case "pass":
                    spf_tags.append("spf5")
                case "neutral":
                    spf_tags.append("spf6")
                case "softfail":
                    spf_tags.append("spf7")
                case "fail":
                    spf_tags.append("spf8")
                case _:
                    raise ValueError(f"Unexpected 'all' tag state: {all_tag}")

    # Check redirect tag
    redirect_tag = spf_results.get("parsed", {}).get("redirect", None)
    if redirect_tag is not None:
        spf_tags.append("spf9")

    # Look up limit check
    # "lookups": 3,
    dns_lookups = spf_results.get("lookups", 0)
    if dns_lookups > 10:
        spf_tags.append("spf11")

    # "valid": true,
    if spf_results["valid"]:
        spf_tags.append("spf12")
    else:
        spf_tags.append("spf13")

    return get_spf_tag_status(spf_tags)


def process_dmarc(dmarc_results):
    def get_dmarc_tag_status(tags):
        processed_dmarc = {"positive_tags": [], "negative_tags": [], "neutral_tags": []}

        for tag in tags:
            if tag in guidance["dmarc"]["pass"]:
                processed_dmarc["positive_tags"].append(tag)
            if tag in guidance["dmarc"]["fail"]:
                processed_dmarc["negative_tags"].append(tag)
            if tag in guidance["dmarc"]["info"]:
                processed_dmarc["neutral_tags"].append(tag)

        if (
            "dmarc10" in processed_dmarc["positive_tags"]
            and "dmarc23" in processed_dmarc["positive_tags"]
            and len(processed_dmarc["negative_tags"]) == 0
        ):
            dmarc_status = "pass"
        else:
            dmarc_status = "fail"

        return processed_dmarc, dmarc_status

    dmarc_tags = []

    if (
        dmarc_results.get("error") == "missing"
        or dmarc_results.get("record", None) is None
    ):
        dmarc_tags.append("dmarc2")
        return get_dmarc_tag_status(dmarc_tags)

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

    # If rua tag exists and doesn't include dmarc@cyber.gc.ca, add dmarc24
    if "dmarc12" not in dmarc_tags and "dmarc10" not in dmarc_tags:
        dmarc_tags.append("dmarc24")

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

    return get_dmarc_tag_status(dmarc_tags)


def process_results(results):
    rcode = results.get("rcode")
    dmarc = results.get("dmarc") or {}
    dkim = results.get("dkim") or {}
    spf = results.get("spf") or {}

    dkim_tags, dkim_selector_tags, dkim_status = (
        ({"positive_tags": [], "negative_tags": [], "neutral_tags": []}, {}, "info")
        if (rcode == "NXDOMAIN" or results["dkim"] is None)
        else process_dkim(
            dkim_results=results["dkim"],
            sends_email=results.get("sends_email"),
        )
    )

    dmarc_tags, dmarc_status = (
        ({"positive_tags": [], "negative_tags": [], "neutral_tags": []}, "info")
        if (rcode == "NXDOMAIN" or results["dmarc"] is None)
        else process_dmarc(results["dmarc"])
    )

    spf_tags, spf_status = (
        ({"positive_tags": [], "negative_tags": [], "neutral_tags": []}, "info")
        if (rcode == "NXDOMAIN" or results["spf"] is None)
        else process_spf(results["spf"])
    )

    # Check DMARC phase (https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna)
    phase = "not implemented"

    effective_policy_source = dmarc.get("effective_policy_source", None)
    effective_policy = dmarc.get("effective_policy", None)
    pct = dmarc.get("tags", {}).get("pct", {}).get("value", None)

    rua_addresses = dmarc.get("tags", {}).get("rua", {}).get("value", [])
    if (
        effective_policy in ["none", "quarantine", "reject"]
        and len(rua_addresses) > 0
    ):
        phase = "assess"

        if dkim_status in ["info", "pass"] and spf_status == "pass":
            phase = "deploy"

            if effective_policy in ["quarantine", "reject"] and pct == 100:
                phase = "maintain"

    has_cyber_rua = False
    if "dmarc10" in dmarc_tags["positive_tags"]:
        has_cyber_rua = True

    dmarc_results = {
        "status": dmarc_status,
        "location": dmarc.get("location", None),
        "record": dmarc.get("record", None),
        "has_cyber_rua": has_cyber_rua,
        "p_policy": dmarc.get("tags", {}).get("p", {}).get("value", None),
        "sp_policy": dmarc.get("tags", {}).get("sp", {}).get("value", None),
        "effective_policy_source": effective_policy_source,
        "effective_policy": effective_policy,
        "pct": pct,
        "phase": phase,
        "neutral_tags": dmarc_tags["neutral_tags"],
        "positive_tags": dmarc_tags["positive_tags"],
        "negative_tags": dmarc_tags["negative_tags"],
    }

    spf_results = {
        "status": spf_status,
        **spf,
        "neutral_tags": spf_tags["neutral_tags"],
        "positive_tags": spf_tags["positive_tags"],
        "negative_tags": spf_tags["negative_tags"],
    }

    dkim_results = {
        "status": dkim_status,
        "positive_tags": dkim_tags["positive_tags"],
        "neutral_tags": dkim_tags["neutral_tags"],
        "negative_tags": dkim_tags["negative_tags"],
        "selectors": {},
    }

    if not dkim.get("error", None):
        for selector in dkim.keys():
            if dkim_selector_tags.get(selector, None) is None:
                continue
            dkim_results["selectors"][selector] = {
                "status": dkim_selector_tags[selector].get("status", None),
                "record": results["dkim"][selector].get("record", None),
                "parsed": results["dkim"][selector].get("parsed", None),
                "key_length": results["dkim"][selector].get("key_size", None),
                "key_type": results["dkim"][selector].get("key_type", None),
                "public_exponent": results["dkim"][selector].get(
                    "public_exponent", None
                ),
                "neutral_tags": dkim_selector_tags[selector]["neutral_tags"],
                "positive_tags": dkim_selector_tags[selector]["positive_tags"],
                "negative_tags": dkim_selector_tags[selector]["negative_tags"],
            }

            # store key_modulus as string, ArangoDB is not capable or storing numbers this size
            key_modulus = results["dkim"][selector].get("public_key_modulus", None)
            if key_modulus:
                dkim_results["selectors"][selector]["key_modulus"] = str(key_modulus)

    timestamp = str(datetime.datetime.now().astimezone())

    return {
        "timestamp": timestamp,
        "domain": results["domain"],
        "base_domain": results.get("base_domain", None),
        "record_exists": results["record_exists"],
        "rcode": results["rcode"],
        "resolve_chain": results.get("resolve_chain", None),
        "resolve_ips": results.get("resolve_ips", None),
        "cname_record": results.get("cname_record", None),
        "mx_records": results.get("mx_records", None),
        "ns_records": results.get("ns_records", None),
        "zone_apex": results.get("zone_apex", None),
        "wildcard_sibling": results.get("wildcard_sibling", None),
        "wildcard_entry": results.get("wildcard_entry", None),
        "dmarc": dmarc_results,
        "spf": spf_results,
        "dkim": dkim_results,
    }
