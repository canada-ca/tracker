import os
import json
import datetime

current_directory = os.path.dirname(os.path.realpath(__file__))
# Opening JSON file from:
# https://raw.githubusercontent.com/CybercentreCanada/ITSP.40.062/main/transport-layer-security/tls-guidance.json
guidance_file = open(f"{current_directory}/tls-guidance.json")
guidance = json.load(guidance_file)


def process_tags(results):
    neutral_tags = []
    positive_tags = []
    negative_tags = []
    accepted_cipher_suites = {}
    accepted_elliptic_curves = []

    if results.get("tls_result").get("error") == "unreachable":
        neutral_tags.append("ssl9")

        processed_tags = {
            "neutral_tags": neutral_tags,
            "positive_tags": positive_tags,
            "negative_tags": negative_tags,
            "accepted_cipher_suites": accepted_cipher_suites,
            "accepted_elliptic_curves": accepted_elliptic_curves
        }

        return processed_tags

    for protocol in results["tls_result"]["accepted_cipher_suites"].keys():

        accepted_cipher_suites[protocol] = []

        for cipher_suite in results["tls_result"]["accepted_cipher_suites"][protocol]:
            if "RC4" in cipher_suite:
                negative_tags.append("ssl3")
            if "3DES" in cipher_suite:
                negative_tags.append("ssl4")

            if cipher_suite in (
                guidance["ciphers"]["1.2"]["recommended"]
                + guidance["ciphers"]["1.3"]["recommended"]
            ):
                strength = "strong"
            elif cipher_suite in (
                guidance["ciphers"]["1.2"]["sufficient"]
                + guidance["ciphers"]["1.3"]["sufficient"]
            ):
                strength = "acceptable"
            else:
                strength = "weak"
                negative_tags.append("ssl6")

            accepted_cipher_suites[protocol].append({"name": cipher_suite, "strength": strength})

    for curve in results["tls_result"]["accepted_elliptic_curves"]:
        if curve.lower() in guidance["curves"]["recommended"]:
            strength = "strong"
        elif curve.lower() in guidance["curves"]["sufficient"]:
            strength = "acceptable"
        else:
            strength = "weak"
            negative_tags.append("ssl10")

        accepted_elliptic_curves.append({"name": curve, "strength": strength})

    try:
        signature_algorithm = results["tls_result"]["certificate_chain_info"]["certificate_info_chain"][0][
            "signature_hash_algorithm"]
    except ValueError:
        signature_algorithm = None

    if signature_algorithm is not None:
        for algorithm in (
            guidance["signature_algorithms"]["recommended"]
            + guidance["signature_algorithms"]["sufficient"]
        ):
            if signature_algorithm.lower() in algorithm:
                positive_tags.append("ssl5")
                break

    if results["tls_result"]["is_vulnerable_to_heartbleed"]:
        negative_tags.append("ssl7")

    if results["tls_result"]["is_vulnerable_to_ccs_injection"]:
        negative_tags.append("ssl8")

    # remove duplicate tags
    positive_tags = list(set(positive_tags))
    neutral_tags = list(set(neutral_tags))
    negative_tags = list(set(negative_tags))

    processed_tags = {
        "neutral_tags": neutral_tags,
        "positive_tags": positive_tags,
        "negative_tags": negative_tags,
        "accepted_cipher_suites": accepted_cipher_suites,
        "accepted_elliptic_curves": accepted_elliptic_curves
    }

    return processed_tags


def process_results(results):
    processed_tags = process_tags(results)

    if results.get("tls_result").get("error") == "unreachable":
        # no web, no problem.
        ssl_status = "info"
        protocol_status = "info"
        cipher_status = "info"
        curve_status = "info"
    else:
        # ssl status
        if len(processed_tags["negative_tags"]) > 0 or "ssl5" not in processed_tags["positive_tags"]:
            ssl_status = "fail"
        else:
            ssl_status = "pass"

        # protocol status
        unaccepted_tls_protocols = [
            "ssl_2_0_cipher_suites",
            "ssl_3_0_cipher_suites",
            "tls_1_0_cipher_suites",
            "tls_1_1_cipher_suites"
        ]

        protocol_status = "pass"

        for suite_list in unaccepted_tls_protocols:
            if len(results["tls_result"]["accepted_cipher_suites"][suite_list]) > 0:
                protocol_status = "fail"

        # get cipher status
        cipher_status = "fail" if "ssl6" in processed_tags["negative_tags"] else "pass"

        # get curve status
        curve_status = "fail" if "ssl10" in processed_tags["negative_tags"] else "pass"

    timestamp = str(datetime.datetime.utcnow())

    tls_result = {
        "domain": results["tls_result"]["request_domain"],
        "ip_address": results["tls_result"]["request_ip_address"],
        "server_location": results["tls_result"]["server_location"],
        "certificate_chain_info": results["tls_result"]["certificate_chain_info"],
        "supports_ecdh_key_exchange": results.get("supports_ecdh_key_exchange", False),
        "heartbleed_vulnerable": results.get("heartbleed", False),
        "ccs_injection_vulnerable": results.get("openssl_ccs_injection", False),
        "accepted_cipher_suites": processed_tags["accepted_cipher_suites"],
        "accepted_elliptic_curves": processed_tags["accepted_elliptic_curves"],
        "positive_tags": processed_tags["positive_tags"],
        "neutral_tags": processed_tags["neutral_tags"],
        "negative_tags": processed_tags["negative_tags"],
        "ssl_status": ssl_status,
        "protocol_status": protocol_status,
        "cipher_status": cipher_status,
        "curve_status": curve_status
    }

    return {"tls_result": tls_result, "chain_result": results["chain_result"], "timestamp": timestamp}
