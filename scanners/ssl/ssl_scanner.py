import os
import sys
import requests
import logging
import json
import threading
import jwt
from enum import Enum
from OpenSSL import SSL
from sslyze.server_connectivity import ServerConnectivityTester
from sslyze.errors import ConnectionToServerFailed
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.connection_helpers.tls_connection import SslConnection
from sslyze.scanner import Scanner, ServerScanRequest
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkLocationViaDirectConnection,
    ServerNetworkConfiguration,
)
from flask import Flask, request

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


headers = {"Content-Type": "application/json"}

destination = "http://result-processor.tracker.svc.cluster.local"

app = Flask(__name__)

TOKEN_KEY = os.getenv("TOKEN_KEY")


@app.route("/receive", methods=["GET", "POST"])
def receive():

    logging.info("Event received\n")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        test_flag = request.headers.get("Test")
        scan_id = decoded_payload["scan_id"]
        domain = decoded_payload["domain"]

        # Perform scan
        res = scan(scan_id, domain)

        # If this was a test scan, return results
        if test_flag == "true":
            return str(res)

        # Construct request payload for result-processor
        if res is not None:
            payload = json.dumps({"results": str(res)})
            token = {"scan_type": "ssl", "scan_id": scan_id}
            logging.info(str(res) + "\n")
        else:
            raise Exception(
                "(SCAN: %s) - An error occurred while attempting to establish SSL connection"
                % scan_id
            )

        headers["Token"] = jwt.encode(token, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        # Dispatch results to result-processor asynchronously
        th = threading.Thread(target=dispatch, args=[scan_id, payload])
        th.start()

        return "Scan sent to result-handling service"

    except Exception as e:
        logging.error(str(e) + "\n")
        return "Failed to send scan to result-handling service"


def dispatch(scan_id, payload):
    """
    Dispatch scan results to result-processor
    :param scan_id: ID of the scan object
    :param payload: Dict containing scan results, encrypted by JWT
    :return: Response from result-processor service
    """
    try:
        # Post request to result-handling service
        response = requests.post(destination + "/receive", headers=headers, data=payload)
        logging.info("Scan %s completed. Results queued for processing...\n" % scan_id)
        logging.info(str(response.text))
        return str(response.text)
    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending scan results: %s\n"
            % (scan_id, e)
        )


def get_server_info(scan_id, domain):
    """
    Retrieve server connectivity info by performing a connection test
    :param scan_id: ID of the scan object
    :param domain: Domain to be assessed
    :return: Server connectivity information
    """

    try:
        # Retrieve server information, look-up IP address
        server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
            domain, 443
        )
        server_tester = ServerConnectivityTester()

        logging.info(
            "\n(SCAN: %s) - Testing connectivity with %s:%s..."
            % (scan_id, server_location.hostname, server_location.port)
        )
        # Test connection to server and retrieve info
        server_info = server_tester.perform(server_location)
        logging.info("(SCAN: %s) - Server Info %s\n" % (scan_id, server_info))

        return server_info

    except ConnectionToServerFailed as e:

        server_info = None
        # Could not establish a TLS connection to the server
        return server_info


def get_supported_tls(highest_supported, domain):

    supported = [highest_supported]

    for version, method in {
        "SSL_2_0": TlsVersionEnum.SSLV2,
        "SSL_3_0": TlsVersionEnum.SSLV3,
        "TLS_1_0": TlsVersionEnum.TLSV1,
        "TLS_1_1": TlsVersionEnum.TLSV1_1,
        "TLS_1_2": TlsVersionEnum.TLSV1_2,
    }.items():

        # Only test SSL/TLS connections with lesser versions
        if highest_supported == version:
            break

        try:
            # Attempt connection
            ctx = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
                domain, 443
            )
            cfg = ServerNetworkConfiguration(domain)
            connx = SslConnection(ctx, cfg, method, True)
            response = connx.connect(domain)
            supported.append(version)
        except Exception as e:
            logging.info(
                "Failed to connect using %s: (%s) - %s" % (version, type(e), e)
            )

    return supported


def scan(scan_id, domain):
    """
    Scan domain to assess SSL/TLS configuration
    :param scan_id: ID of the scan object
    :param domain: Domain to be scanned
    :return: Scan results for provided domain
    """
    server_info = get_server_info(scan_id, domain)

    if server_info is None:
        return None
    else:
        # Retrieve highest TLS supported from retrieved server info
        highest_tls_supported = str(
            server_info.tls_probing_result.highest_tls_version_supported
        ).split(".")[1]

    tls_supported = get_supported_tls(highest_tls_supported, domain)

    scanner = Scanner()

    designated_scans = set()

    # Scan for common vulnerabilities and certificate info
    designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
    designated_scans.add(ScanCommand.HEARTBLEED)
    designated_scans.add(ScanCommand.CERTIFICATE_INFO)

    # Test supported SSL/TLS
    if "SSL_2_0" in tls_supported:
        designated_scans.add(ScanCommand.SSL_2_0_CIPHER_SUITES)
    elif "SSL_3_0" in tls_supported:
        designated_scans.add(ScanCommand.SSL_3_0_CIPHER_SUITES)
    elif "TLS_1_0" in tls_supported:
        designated_scans.add(ScanCommand.TLS_1_0_CIPHER_SUITES)
    elif "TLS_1_1" in tls_supported:
        designated_scans.add(ScanCommand.TLS_1_1_CIPHER_SUITES)
    elif "TLS_1_2" in tls_supported:
        designated_scans.add(ScanCommand.TLS_1_2_CIPHER_SUITES)
    elif "TLS_1_3" in tls_supported:
        designated_scans.add(ScanCommand.TLS_1_3_CIPHER_SUITES)

    scan_request = ServerScanRequest(
        server_info=server_info, scan_commands=designated_scans
    )

    scanner.queue_scan(scan_request)

    # Wait for asynchronous scans to complete
    # get_results() returns a generator with a single "ServerScanResult". We only want that object
    scan_results = [x for x in scanner.get_results()][0]

    res = {
        "TLS": {
            "supported": tls_supported,
            "accepted_cipher_list": set(),
            "preferred_cipher": None,
            "rejected_cipher_list": set(),
        }
    }

    # Parse scan results for required info
    for name, result in scan_results.scan_commands_results.items():

        # If CipherSuitesScanResults
        if name.endswith("suites"):

            for c in result.accepted_cipher_suites:
                res["TLS"]["accepted_cipher_list"].add(c.cipher_suite.name)

            for c in result.rejected_cipher_suites:
                res["TLS"]["rejected_cipher_list"].add(c.cipher_suite.name)

            # We want the preferred cipher for the highest SSL/TLS version supported
            if str(result.tls_version_used).split(".")[1] == highest_tls_supported:
                res["TLS"][
                    "preferred_cipher"
                ] = result.cipher_suite_preferred_by_server.cipher_suite.name

        elif name is "openssl_ccs_injection":
            res[
                "is_vulnerable_to_ccs_injection"
            ] = result.is_vulnerable_to_ccs_injection

        elif name is "heartbleed":
            res["is_vulnerable_to_heartbleed"] = result.is_vulnerable_to_heartbleed

        elif name is "certificate_info":
            res["signature_algorithm"] = (
                result.certificate_deployments[0]
                .verified_certificate_chain[0]
                .signature_hash_algorithm.__class__.__name__
            )

    rc4 = False
    triple_des = False

    # Check for RC4/3DES ciphers
    for cipher in res["TLS"]["accepted_cipher_list"]:
        if "RC4" in cipher:
            rc4 = True
        if "3DES" in cipher:
            triple_des = True

    res["rc4"] = rc4
    res["3des"] = triple_des

    return res


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
