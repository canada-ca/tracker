import os
import json
import datetime

current_directory = os.path.dirname(os.path.realpath(__file__))
# Opening JSON file from:
# https://raw.githubusercontent.com/CybercentreCanada/ITSP.40.062/main/transport-layer-security/tls-guidance.json
guidance_file = open(f"{current_directory}/tls-guidance.json")
guidance = json.load(guidance_file)


def process_tls_results(tls_results):
    neutral_tags = []
    positive_tags = []
    negative_tags = []
    accepted_cipher_suites = {}
    accepted_elliptic_curves = []

    ssl_status = "info"
    protocol_status = "info"
    cipher_status = "info"
    curve_status = "info"

    if tls_results.get("error"):
        neutral_tags.append("ssl9")

        processed_tags = {
            "neutral_tags": neutral_tags,
            "positive_tags": positive_tags,
            "negative_tags": negative_tags,
            "accepted_cipher_suites": accepted_cipher_suites,
            "accepted_elliptic_curves": accepted_elliptic_curves,
            "ssl_status": ssl_status,
            "protocol_status": protocol_status,
            "cipher_status": cipher_status,
            "curve_status": curve_status
        }

        return processed_tags

    for protocol in tls_results["accepted_cipher_suites"].keys():
        accepted_cipher_suites[protocol] = []

        for cipher_suite in tls_results["accepted_cipher_suites"][protocol]:
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

    for curve in tls_results["accepted_elliptic_curves"]:
        if curve.lower() in guidance["curves"]["recommended"]:
            strength = "strong"
        elif curve.lower() in guidance["curves"]["sufficient"]:
            strength = "acceptable"
        else:
            strength = "weak"
            negative_tags.append("ssl10")

        accepted_elliptic_curves.append({"name": curve, "strength": strength})

    try:
        signature_algorithm = tls_results["certificate_chain_info"]["certificate_info_chain"][0][
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

    if tls_results["is_vulnerable_to_heartbleed"]:
        negative_tags.append("ssl7")

    if tls_results["is_vulnerable_to_ccs_injection"]:
        negative_tags.append("ssl8")

    # remove duplicate tags
    positive_tags = list(set(positive_tags))
    neutral_tags = list(set(neutral_tags))
    negative_tags = list(set(negative_tags))

    # protocol status
    unaccepted_tls_protocols = [
        "ssl_2_0_cipher_suites",
        "ssl_3_0_cipher_suites",
        "tls_1_0_cipher_suites",
        "tls_1_1_cipher_suites"
    ]

    # ssl status
    if len(negative_tags) > 0 or "ssl5" not in positive_tags:
        ssl_status = "fail"
    else:
        ssl_status = "pass"

    # get protocol status
    protocol_status = "pass"
    for suite_list in unaccepted_tls_protocols:
        if len(accepted_cipher_suites[suite_list]) > 0:
            protocol_status = "fail"

    # get cipher status
    cipher_status = "fail" if "ssl6" in negative_tags else "pass"

    # get curve status
    curve_status = "fail" if "ssl10" in negative_tags else "pass"

    processed_tags = {
        "neutral_tags": neutral_tags,
        "positive_tags": positive_tags,
        "negative_tags": negative_tags,
        "accepted_cipher_suites": accepted_cipher_suites,
        "accepted_elliptic_curves": accepted_elliptic_curves,
        "ssl_status": ssl_status,
        "protocol_status": protocol_status,
        "cipher_status": cipher_status,
        "curve_status": curve_status
    }

    return processed_tags


def process_connection_results(connection_results):
    positive_tags = []
    neutral_tags = []
    negative_tags = []

    http_connections = connection_results["http_chain_result"]["connections"]
    https_connections = connection_results["https_chain_result"]["connections"]

    http_live = not http_connections[0]["error"]
    https_live = not https_connections[0]["error"]

    hsts_status = None
    https_status = None

    http_immediately_upgrades = None
    http_eventually_upgrades = None
    https_immediately_downgrades = None
    https_eventually_downgrades = None
    hsts_parsed = None

    def check_https_downgrades(connections):
        for connection in connections:
            if connection["scheme"] == "http":
                return True
        return False

    # check HTTPS properties
    if https_live:
        # check if https chain immediately downgrades connection
        https_immediately_downgrades = check_https_downgrades(https_connections[:1])

        # check if https chain eventually downgrades connection
        https_eventually_downgrades = check_https_downgrades(https_connections)

        # check HSTS header
        hsts = None
        try:
            hsts = https_connections[0]["connection"]["headers"]["strict-transport-security"]
        except KeyError:
            pass

        if hsts:
            max_age = None
            include_subdomains = False
            preload = False

            directives = [directive.strip() for directive in hsts.split(";") if len(directive) > 0]

            for directive in directives:
                match directive:
                    case d if directive.startswith("max-age="):
                        max_age = int(d.split("=")[1])
                    case _ if directive == "includeSubDomains":
                        include_subdomains = True
                    case _ if directive.startswith("preload"):
                        preload = True

            hsts_parsed = {
                "max_age": max_age,
                "include_subdomains": include_subdomains,
                "preload": preload
            }

            hsts_status = "pass" if hsts and max_age > 0 else "fail"

    # check HTTP properties
    if http_live:
        http_immediately_upgrades = None
        http_eventually_upgrades = None
        try:
            # find index of first https upgrade
            first_https_index = list(conn["scheme"] == "https" for conn in http_connections).index(True)

            # check if HTTP connection is immediately upgraded (redirected) to HTTPS
            if first_https_index == 1:
                http_immediately_upgrades = True
            # check if HTTP connection eventually is upgraded (redirected) to HTTPS
            if first_https_index >= 1:
                http_eventually_upgrades = True

        except IndexError:
            pass

    http_down_or_redirect = not http_live or http_immediately_upgrades

    if not http_live and not https_live:
        # no live endpoints, give info status
        https_status = "info"
    else:
        # live endpoints exist, check for upgrades/downgrades
        if http_down_or_redirect and https_live and not https_eventually_downgrades:
            https_status = "pass"
        else:
            https_status = "fail"

    # process tags
    if https_eventually_downgrades or https_immediately_downgrades:
        negative_tags.append("https3")

    # merge results
    processed_connection_results = {
        "neutral_tags": neutral_tags,
        "positive_tags": positive_tags,
        "negative_tags": negative_tags,
        "hsts_status": hsts_status,
        "https_status": https_status,
        "http_live": http_live,
        "https_live": https_live,
        "http_immediately_upgrades": http_immediately_upgrades,
        "http_eventually_upgrades": http_eventually_upgrades,
        "https_immediately_downgrades": https_immediately_downgrades,
        "https_eventually_downgrades": https_eventually_downgrades,
        "hsts_parsed": hsts_parsed
    } | connection_results

    return processed_connection_results


def process_results(results):

    processed_tls_results = process_tls_results(results["tls_result"])

    tls_result = {
        "domain": results["tls_result"]["request_domain"],
        "ip_address": results["tls_result"]["request_ip_address"],
        "server_location": results["tls_result"]["server_location"],
        "certificate_chain_info": results["tls_result"]["certificate_chain_info"],
        "supports_ecdh_key_exchange": results.get("supports_ecdh_key_exchange", False),
        "heartbleed_vulnerable": results.get("heartbleed", False),
        "ccs_injection_vulnerable": results.get("openssl_ccs_injection", False),
        "accepted_cipher_suites": processed_tls_results["accepted_cipher_suites"],
        "accepted_elliptic_curves": processed_tls_results["accepted_elliptic_curves"],
        "positive_tags": processed_tls_results["positive_tags"],
        "neutral_tags": processed_tls_results["neutral_tags"],
        "negative_tags": processed_tls_results["negative_tags"],
        "ssl_status": processed_tls_results["ssl_status"],
        "protocol_status": processed_tls_results["protocol_status"],
        "cipher_status": processed_tls_results["cipher_status"],
        "curve_status": processed_tls_results["curve_status"]
    }

    processed_connection_results = process_connection_results(results["chain_result"])

    timestamp = str(datetime.datetime.utcnow())

    return {"tls_result": tls_result, "connection_results": processed_connection_results, "timestamp": timestamp}
