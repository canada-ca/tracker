import os
import sys
import time
import requests
import logging
import json
import emoji
import asyncio
import traceback
import signal
import scapy
import datetime as dt
from enum import Enum
from OpenSSL import SSL
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse
from sslyze.server_connectivity import ServerConnectivityTester
from sslyze.errors import ConnectionToServerFailed, ServerHostnameCouldNotBeResolved
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.connection_helpers.tls_connection import SslConnection
from sslyze.scanner import Scanner, ServerScanRequest
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkLocationViaDirectConnection,
    ServerNetworkConfiguration,
)

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

QUEUE_URL = os.getenv("RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local")


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


def dispatch_results(payload, client):
    client.post(QUEUE_URL + "/ssl", json=payload)
    logging.info("Scan results dispatched to result queue")


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
            f"Testing connectivity with {server_location.hostname}:{server_location.port}..."
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
                f"Failed to connect using %{version}: ({type(e)}) - {e}"
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

    # Scan for common vulnerabilities, certificate info, elliptic curves
    designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
    designated_scans.add(ScanCommand.HEARTBLEED)
    designated_scans.add(ScanCommand.CERTIFICATE_INFO)
    designated_scans.add(ScanCommand.ELLIPTIC_CURVES)

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
    logging.info("Scan results retrieved from generator")

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
            logging.info("Parsing Cipher Suite Scan results...")

            accepted_cipher_list = list()
            for c in result.accepted_cipher_suites:
                accepted_cipher_list.append(c.cipher_suite.name)

            res["TLS"]["accepted_cipher_list"] = accepted_cipher_list

            rejected_cipher_list = list()
            for c in result.rejected_cipher_suites:
                rejected_cipher_list.append(c.cipher_suite.name)

            res["TLS"]["rejected_cipher_list"] = rejected_cipher_list

            if result.cipher_suite_preferred_by_server is not None:
                # We want the preferred cipher for the highest SSL/TLS version supported
                if str(result.tls_version_used).split(".")[1] == highest_tls_supported:
                    res["TLS"][
                        "preferred_cipher"
                    ] = result.cipher_suite_preferred_by_server.cipher_suite.name

        elif name == "openssl_ccs_injection":
            logging.info("Parsing OpenSSL CCS Injection Vulnerability Scan results...")
            res[
                "is_vulnerable_to_ccs_injection"
            ] = result.is_vulnerable_to_ccs_injection

        elif name == "heartbleed":
            logging.info("Parsing Heartbleed Vulnerability Scan results...")
            res["is_vulnerable_to_heartbleed"] = result.is_vulnerable_to_heartbleed

        elif name == "certificate_info":
            logging.info("Parsing Certificate Info Scan results...")
            try:
                res["signature_algorithm"] = (
                    result.certificate_deployments[0]
                    .verified_certificate_chain[0]
                    .signature_hash_algorithm.__class__.__name__
                )
            except TypeError:
                res["signature_algorithm"] = None

        else:
            logging.info("Parsing Elliptic Curve Scan results...")
            res["supports_ecdh_key_exchange"] = result.supports_ecdh_key_exchange
            res["supported_curves"] = []
            for curve in result.supported_curves:
                res["supported_curves"].append(curve.name)

    return res


def process_results(results):
    logging.info("Processing SSL scan results...")
    report = {}

    # Get cipher/protocol data via sslyze for a host.

    if results is None or results == {}:
        report = {"missing": True}

    else:
        for version in [
            "SSL_2_0",
            "SSL_3_0",
            "TLS_1_0",
            "TLS_1_1",
            "TLS_1_2",
            "TLS_1_3",
        ]:
            if version in results["TLS"]["supported"]:
                report[version] = True
            else:
                report[version] = False

        report["cipher_list"] = results["TLS"]["accepted_cipher_list"]
        report["signature_algorithm"] = results.get("signature_algorithm", "unknown")
        report["preferred_cipher"] = results["TLS"]["preferred_cipher"]
        report["heartbleed"] = results.get("is_vulnerable_to_heartbleed", False)
        report["openssl_ccs_injection"] = results.get("is_vulnerable_to_ccs_injection", False)
        report["supports_ecdh_key_exchange"] = results.get("supports_ecdh_key_exchange", False)
        report["supported_curves"] = results["supported_curves"]

    logging.info(f"Processed SSL scan results: {str(report)}")
    return report


def Server(server_client=requests):
    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        def timeout_handler(signum, frame):
            msg = "Timeout while performing scan"
            logging.error(msg)
            return PlainTextResponse(msg)

        try:
            start_time = dt.datetime.now()
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(80)
            try:
                domain = inbound_payload["domain"]
                uuid = inbound_payload["uuid"]
                domain_key = inbound_payload["domain_key"]
            except KeyError:
                msg = f"Invalid scan request format received: {str(inbound_payload)}"
                logging.error(msg)
                return PlainTextResponse(msg)

            logging.info("Performing scan...")
            scan_results = scan_ssl(domain)

            if scan_results is not None:

                processed_results = process_results(scan_results)

                outbound_payload = json.dumps(
                    {
                        "results": processed_results,
                        "scan_type": "ssl",
                        "uuid": uuid,
                        "domain_key": domain_key
                    }
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("SSL scan not completed")

        except ServerHostnameCouldNotBeResolved as e:
            signal.alarm(0)
            msg = f"The designated domain could not be resolved: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            dispatch_results(
                {"scan_type": "ssl", "uuid": uuid, "domain_key": domain_key, "results": {"missing": True}}, server_client
            )
            return PlainTextResponse(msg)

        except Exception as e:
            signal.alarm(0)
            msg = f"An unexpected error occurred while attempting to process SSL scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
            dispatch_results(
                {"scan_type": "ssl", "uuid": uuid, "domain_key": domain_key, "results": {"missing": True}}, server_client
            )
            return PlainTextResponse(msg)

        signal.alarm(0)
        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client)
        msg = f"SSL scan completed in {elapsed_time.total_seconds()} seconds."
        logging.info(msg)

        return PlainTextResponse(msg)

    async def startup():
        logging.info(emoji.emojize("ASGI server started :rocket:"))

    async def shutdown():
        logging.info(emoji.emojize("ASGI server shutting down..."))

    routes = [
        Route("/", scan, methods=["POST"]),
    ]

    starlette_app = Starlette(
        debug=True, routes=routes, on_startup=[startup], on_shutdown=[shutdown]
    )

    return starlette_app


app = Server()
