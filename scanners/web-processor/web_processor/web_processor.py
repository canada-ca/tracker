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
    strong_ciphers = []
    acceptable_ciphers = []
    weak_ciphers = []
    strong_curves = []
    acceptable_curves = []
    weak_curves = []

    processed_tags = {
        "neutral_tags": neutral_tags,
        "positive_tags": positive_tags,
        "negative_tags": negative_tags,
        "strong_ciphers": strong_ciphers,
        "acceptable_ciphers": acceptable_ciphers,
        "weak_ciphers": weak_ciphers,
        "strong_curves": strong_curves,
        "acceptable_curves": acceptable_curves,
        "weak_curves": weak_curves
    }

    if results.get("tls_result").get("error") == "unreachable":
        neutral_tags.append("ssl9")

        return processed_tags

    all_cipher_suites = []
    for ciphers in results["tls_result"]["accepted_cipher_suites"]:
        all_cipher_suites.extend(ciphers)

    for cipher in all_cipher_suites:
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

    for curve in results["tls_result"]["accepted_elliptic_curves"]:
        if curve.lower() in guidance["curves"]["recommended"]:
            strong_curves.append(curve)
        elif curve.lower() in guidance["curves"]["sufficient"]:
            acceptable_curves.append(curve)
        else:
            weak_curves.append(curve)

    try:
        signature_algorithm = results["tls_result"]["certificate_chain_info"][0]["signature_hash_algorithm"]
    except ValueError:
        signature_algorithm = None

    if signature_algorithm is not None:
        for algorithm in (
            guidance["signature_algorithms"]["recommended"]
            + guidance["signature_algorithms"]["sufficient"]
        ):
            if results["signature_algorithm"].lower() in algorithm:
                positive_tags.append("ssl5")
                break

    if len(weak_ciphers) > 0:
        negative_tags.append("ssl6")

    if len(weak_curves) > 0:
        negative_tags.append("ssl10")

    if results["tls_results"]["is_vulnerable_to_heartbleed"]:
        negative_tags.append("ssl7")

    if results["tls_results"]["is_vulnerable_to_ccs_injection"]:
        negative_tags.append("ssl8")

    return processed_tags


def process_results(results):
    timestamp = str(datetime.datetime.utcnow())

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
            if len(results["tls_results"]["accepted_cipher_suites"][suite_list]) > 0:
                protocol_status = "fail"

        # get cipher status
        cipher_status = "fail" if len(processed_tags["weak_ciphers"]) > 0 else "pass"

        # get curve status
        curve_status = "fail" if len(processed_tags["weak_curves"]) > 0 else "pass"

    tls_results = {
        "timestamp": timestamp,
        "strong_ciphers": processed_tags["strong_ciphers"],
        "acceptable_ciphers": processed_tags["acceptable_ciphers"],
        "weak_ciphers": processed_tags["weak_ciphers"],
        "strong_curves": processed_tags["strong_curves"],
        "acceptable_curves": processed_tags["acceptable_curves"],
        "weak_curves": processed_tags["weak_curves"],
        "supports_ecdh_key_exchange": results.get("supports_ecdh_key_exchange", False),
        "heartbleed_vulnerable": results.get("heartbleed", False),
        "ccs_injection_vulnerable": results.get("openssl_ccs_injection", False),
        "neutral_tags": processed_tags["neutral_tags"],
        "positive_tags": processed_tags["positive_tags"],
        "negative_tags": processed_tags["negative_tags"],
        "ssl_status": ssl_status,
        "protocol_status": protocol_status,
        "cipher_status": cipher_status,
        "curve_status": curve_status
    }

    return tls_results
