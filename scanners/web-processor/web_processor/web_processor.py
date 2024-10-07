import os
import json
from urllib.parse import urlparse

current_directory = os.path.dirname(os.path.realpath(__file__))
# Opening JSON file from:
# https://raw.githubusercontent.com/CybercentreCanada/ITSP.40.062/main/transport-layer-security/tls-guidance.json
guidance_file = open(f"{current_directory}/tls-guidance.json")
guidance = json.load(guidance_file)


def process_tls_results(tls_results, web_server_present):
    neutral_tags = []
    positive_tags = []
    negative_tags = []
    accepted_cipher_suites = {}
    accepted_elliptic_curves = []

    ssl_status = "info"
    certificate_status = "info"
    protocol_status = "info"
    cipher_status = "info"
    curve_status = "info"

    if tls_results.get("error"):
        # if endpoint is live and no certificate detected, set status to fail
        if (
            tls_results.get("scan_status", None) == "ERROR_NO_CONNECTIVITY"
            and web_server_present
        ):
            ssl_status = "fail"
            certificate_status = "fail"
            protocol_status = "fail"
            cipher_status = "fail"
            curve_status = "fail"
            negative_tags.append("ssl2")

        processed_tags = {
            "neutral_tags": neutral_tags,
            "positive_tags": positive_tags,
            "negative_tags": negative_tags,
            "accepted_cipher_suites": accepted_cipher_suites,
            "accepted_elliptic_curves": accepted_elliptic_curves,
            "ssl_status": ssl_status,
            "protocol_status": protocol_status,
            "cipher_status": cipher_status,
            "curve_status": curve_status,
            "certificate_status": certificate_status,
        }

        return processed_tags

    accepted_cipher_keys_original = tls_results.get("accepted_cipher_suites", {})
    if isinstance(accepted_cipher_keys_original, dict):
        accepted_cipher_keys = accepted_cipher_keys_original.keys()
    else:
        accepted_cipher_keys = []
    for protocol in accepted_cipher_keys:
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
            elif cipher_suite in guidance["ciphers"]["1.2"]["phase_out"]:
                strength = "phase_out"
                neutral_tags.append("ssl23")
            else:
                strength = "weak"
                negative_tags.append("ssl6")

            accepted_cipher_suites[protocol].append(
                {"name": cipher_suite, "strength": strength}
            )

    weak_curve = False
    result_accepted_elliptic_curves = tls_results.get("accepted_elliptic_curves", [])
    for curve in result_accepted_elliptic_curves:
        if curve.lower() in guidance["curves"]["recommended"]:
            strength = "strong"
        elif curve.lower() in guidance["curves"]["sufficient"]:
            strength = "acceptable"
        elif curve.lower() in guidance["curves"]["phase_out"]:
            strength = "phase_out"
            neutral_tags.append("ssl22")
        else:
            strength = "weak"
            weak_curve = True
            negative_tags.append("ssl17")

        accepted_elliptic_curves.append({"name": curve, "strength": strength})

    try:
        signature_algorithm = tls_results["certificate_chain_info"][
            "certificate_chain"
        ][0]["signature_hash_algorithm"]
    except ValueError:
        signature_algorithm = None
    except TypeError:
        signature_algorithm = None

    try:
        if tls_results["certificate_chain_info"]["certificate_chain"][0][
            "expired_cert"
        ]:
            negative_tags.append("ssl10")
    except TypeError:
        pass

    try:
        if tls_results["certificate_chain_info"]["certificate_chain"][0][
            "self_signed_cert"
        ]:
            negative_tags.append("ssl11")
    except TypeError:
        pass

    try:
        if tls_results["certificate_chain_info"]["certificate_chain"][0][
            "cert_revoked"
        ]:
            negative_tags.append("ssl12")
    except TypeError:
        pass

    try:
        if (
            tls_results["certificate_chain_info"]["certificate_chain"][0][
                "cert_revoked_status"
            ]
            is None
        ):
            neutral_tags.append("ssl13")
    except TypeError:
        pass

    try:
        if tls_results["certificate_chain_info"]["bad_hostname"]:
            negative_tags.append("ssl15")
    except TypeError:
        pass

    try:
        if not tls_results["certificate_chain_info"]["passed_validation"]:
            negative_tags.append("ssl16")
    except TypeError:
        pass

    if signature_algorithm is not None:
        for algorithm in (
            guidance["signature_algorithms"]["recommended"]
            + guidance["signature_algorithms"]["sufficient"]
        ):
            if signature_algorithm.lower() in algorithm:
                # positive_tags.append("ssl5")
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
        "tls_1_1_cipher_suites",
    ]

    # certificate status
    if (
        len(tls_results.get("certificate_chain_info", {}).get("certificate_chain", []))
        > 0
    ):
        if any(
            tag in negative_tags
            for tag in ["ssl5", "ssl10", "ssl11", "ssl12", "ssl15", "ssl16"]
        ):
            certificate_status = "fail"
        else:
            certificate_status = "pass"
            positive_tags.append("ssl21")

    # get protocol status
    if accepted_cipher_suites:
        protocol_status = "pass"
        for suite_list in unaccepted_tls_protocols:
            if len(accepted_cipher_suites[suite_list]) > 0:
                protocol_status = "fail"
                negative_tags.append("ssl24")
                break
        if protocol_status == "pass":
            positive_tags.append("ssl18")

        # get cipher status
        if "ssl6" in negative_tags:
            cipher_status = "fail"
        else:
            cipher_status = "pass"
            positive_tags.append("ssl19")

    # get curve status
    if tls_results.get("accepted_elliptic_curves", []):
        if weak_curve:
            curve_status = "fail"
        else:
            curve_status = "pass"
            positive_tags.append("ssl20")

    if protocol_status == cipher_status == curve_status == certificate_status == "pass":
        ssl_status = "pass"
    elif (
        protocol_status == cipher_status == curve_status == certificate_status == "info"
    ):
        ssl_status = "info"
    else:
        ssl_status = "fail"

    processed_tags = {
        "neutral_tags": neutral_tags,
        "positive_tags": positive_tags,
        "negative_tags": negative_tags,
        "accepted_cipher_suites": accepted_cipher_suites,
        "accepted_elliptic_curves": accepted_elliptic_curves,
        "ssl_status": ssl_status,
        "protocol_status": protocol_status,
        "cipher_status": cipher_status,
        "curve_status": curve_status,
        "certificate_status": certificate_status,
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
    hsts = None

    # set hsts status defaults
    if http_live or https_live:
        # default "fail" if either endpoint alive
        hsts_status = "fail"
    elif not http_live and not https_live:
        # status should be "info" if neither endpoint live
        hsts_status = "info"

    def check_https_downgrades(connections):
        for connection in connections:
            if connection["scheme"] == "http":
                return True
        return False

    # check HTTP properties
    if http_live:
        http_immediately_upgrades = None
        http_eventually_upgrades = None
        try:
            # find index of first https upgrade
            first_https_index = list(
                conn["scheme"] == "https" for conn in http_connections
            ).index(True)

            # check if HTTP connection is immediately upgraded (redirected) to HTTPS
            if first_https_index == 1:
                http_immediately_upgrades = True
            # check if HTTP connection eventually is upgraded (redirected) to HTTPS
            if first_https_index >= 1:
                http_eventually_upgrades = True

        except IndexError:
            pass
        except ValueError:
            pass

        # check redirect is for same hostname (to ensure HSTS is applied)
        redirect_url = http_connections[0]["connection"]["redirect_to"]
        if redirect_url is not None:
            parsed_url = urlparse(redirect_url)
            redirect_url = f"{parsed_url.scheme}://{parsed_url.hostname}"
            if redirect_url != f'https://{connection_results["domain"]}':
                negative_tags.append("https14")
        else:
            negative_tags.append("https14")

    # check HTTPS properties
    if https_live:
        # check if https chain immediately downgrades connection
        https_immediately_downgrades = check_https_downgrades(https_connections[:1])

        # check if https chain eventually downgrades connection
        https_eventually_downgrades = check_https_downgrades(https_connections)

        # check HSTS header
        try:
            for header, value in https_connections[0]["connection"]["headers"].items():
                if header.lower() == "strict-transport-security":
                    hsts = value
                    break
        except KeyError:
            pass

        if hsts:
            max_age = None
            include_subdomains = False
            preload = False

            # if multiple headers, take the first one
            # these are separated by commas
            hsts = hsts.split(",")[0]

            directives = [
                directive.strip()
                for directive in hsts.split(";")
                if len(directive.strip()) > 0
            ]

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
                "preload": preload,
            }

            if (
                hsts
                and isinstance(max_age, int)
                and max_age > 0
                and "https14" not in negative_tags
            ):
                hsts_status = "pass"
            else:
                hsts_status = "fail"

    http_down_or_redirect = not http_live or http_immediately_upgrades

    # process tags
    if https_eventually_downgrades or https_immediately_downgrades:
        negative_tags.append("https3")

    if http_live and not https_live:
        negative_tags.append("https6")

    if (
        https_live
        and http_live
        and not (http_immediately_upgrades or http_eventually_upgrades)
    ):
        negative_tags.append("https7")

    if (
        https_live
        and http_live
        and not http_immediately_upgrades
        and http_eventually_upgrades
    ):
        negative_tags.append("https8")

    if https_live and not hsts:
        negative_tags.append("https9")

    try:
        if hsts_parsed["preload"]:
            pass
    except TypeError:
        pass

    if not http_live and not https_live:
        neutral_tags.append("https13")

    # calculate status
    fail_tags = ["https3", "https6", "https7", "https8"]
    if "https13" in neutral_tags:
        # no live endpoints, give info status
        https_status = "info"
    elif any(tag in negative_tags for tag in fail_tags):
        https_status = "fail"
    else:
        https_status = "pass"
        positive_tags.append("https15")

    if hsts_status == "pass":
        positive_tags.append("https16")

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
        "hsts_parsed": hsts_parsed,
    } | connection_results

    return processed_connection_results


def process_results(results):
    processed_connection_results = process_connection_results(results["chain_result"])

    web_server_present = processed_connection_results.get(
        "http_live", False
    ) or processed_connection_results.get("https_live", False)

    processed_tls_results = process_tls_results(
        results["tls_result"], web_server_present
    )

    tls_result = {
        "domain": results["tls_result"]["request_domain"],
        "ip_address": results["tls_result"]["request_ip_address"],
        "server_location": results["tls_result"]["server_location"],
        "certificate_chain_info": results["tls_result"]["certificate_chain_info"],
        "supports_ecdh_key_exchange": results["tls_result"].get(
            "supports_ecdh_key_exchange", None
        ),
        "heartbleed_vulnerable": results["tls_result"].get(
            "is_vulnerable_to_heartbleed", None
        ),
        "ccs_injection_vulnerable": results["tls_result"].get(
            "is_vulnerable_to_ccs_injection", None
        ),
        "robot_vulnerable": results["tls_result"].get("is_vulnerable_to_robot", None),
        "accepted_cipher_suites": processed_tls_results["accepted_cipher_suites"],
        "accepted_elliptic_curves": processed_tls_results["accepted_elliptic_curves"],
        "positive_tags": processed_tls_results["positive_tags"],
        "neutral_tags": processed_tls_results["neutral_tags"],
        "negative_tags": processed_tls_results["negative_tags"],
        "ssl_status": processed_tls_results["ssl_status"],
        "certificate_status": processed_tls_results["certificate_status"],
        "protocol_status": processed_tls_results["protocol_status"],
        "cipher_status": processed_tls_results["cipher_status"],
        "curve_status": processed_tls_results["curve_status"],
    }

    timestamp = results.get("timestamp")

    return {
        "tls_result": tls_result,
        "connection_results": processed_connection_results,
        "timestamp": timestamp,
    }
