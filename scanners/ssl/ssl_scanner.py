import os
import sys
import requests
import logging
import json
import emoji
from enum import Enum
from OpenSSL import SSL
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from starlette.background import BackgroundTask
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

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/process", json=payload
    )


def get_server_info(domain):
    """
    Retrieve server connectivity info by performing a connection test
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
            "\nTesting connectivity with %s:%s..."
            % (server_location.hostname, server_location.port)
        )
        # Test connection to server and retrieve info
        server_info = server_tester.perform(server_location)
        logging.info("Server Info %s\n" % server_info)

        return server_info

    except ConnectionToServerFailed as e:
        # Could not establish a TLS connection to the server
        return None


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


def scan_ssl(domain):

    server_info = get_server_info(domain)

    if server_info is None:
        return {}
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

            accepted_cipher_list = list()
            for c in result.accepted_cipher_suites:
                accepted_cipher_list.append(c.cipher_suite.name)

            res["TLS"]["accepted_cipher_list"] = accepted_cipher_list

            rejected_cipher_list = list()
            for c in result.rejected_cipher_suites:
                rejected_cipher_list.append(c.cipher_suite.name)

            res["TLS"]["rejected_cipher_list"] = rejected_cipher_list

            # We want the preferred cipher for the highest SSL/TLS version supported
            if str(result.tls_version_used).split(".")[1] == highest_tls_supported:
                res["TLS"][
                    "preferred_cipher"
                ] = result.cipher_suite_preferred_by_server.cipher_suite.name

        elif name == "openssl_ccs_injection":
            res[
                "is_vulnerable_to_ccs_injection"
            ] = result.is_vulnerable_to_ccs_injection

        elif name == "heartbleed":
            res["is_vulnerable_to_heartbleed"] = result.is_vulnerable_to_heartbleed

        elif name == "certificate_info":
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


def Server(default_client=requests):
    async def scan(request):
        try:
            client = request.app.state.client

            logging.info("Scan request received")
            inbound_payload = await request.json()
            domain = inbound_payload["domain"]
            scan_id = inbound_payload["scan_id"]

            logging.info("Performing scan...")
            scan_results = scan_ssl(domain)

            if scan_results is not None:
                outbound_payload = json.dumps(
                    {"results": scan_results, "scan_type": "ssl", "scan_id": scan_id}
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("SSL scan not completed")
            dispatch_results(outbound_payload, client)
        except Exception as e:
            return PlainTextResponse(
                f"An error occurred while attempting to process SSL scan request: {str(e)}"
            )

        return PlainTextResponse(
            "SSL scan completed. Scan results dispatched to result-processor"
        )

    routes = [
        Route("/scan", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


app = Server()
