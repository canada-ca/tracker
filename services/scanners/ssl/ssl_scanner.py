import os
import sys
import time
import requests
import logging
import json
import emoji
import asyncio
import traceback
import scapy
import datetime as dt
from enum import Enum
from multiprocessing import Process, Manager
from OpenSSL import SSL
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import Response
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

TIMEOUT = 80  # 80 second scan timeout

QUEUE_URL = os.getenv(
    "RESULT_QUEUE_URL", "http://result-queue.scanners.svc.cluster.local"
)


class ScanTimeoutException(BaseException):
    pass


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
            # If connection fails, exception will be raised, causing the failure to be
            # logged and the version to not be appended to the supported list
            ctx = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
                domain, 443
            )
            cfg = ServerNetworkConfiguration(domain)
            connx = SslConnection(ctx, cfg, method, True)
            connx.connect(domain)
            supported.append(version)
        except Exception as e:
            logging.info(f"Failed to connect using %{version}: ({type(e)}) - {e}")

    return supported


def scan_ssl(domain, res_dict):
    try:
        server_info = get_server_info(domain)
    except ConnectionToServerFailed as e:
        logging.error(f"Failed to connect to {domain}: {e.error_message}")
        return {}

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

    scanner.start_scans([scan_request])

    # Wait for asynchronous scans to complete
    # get_results() returns a generator with a single "ServerScanResult". We only want that object
    scan_results = [x for x in scanner.get_results()][0]
    logging.info("Scan results retrieved from generator")

    res = {
        "TLS": {
            "supported": tls_supported,
            "accepted_cipher_list": set(),
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

    res_dict["results"] = res
    return res_dict


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
        report["heartbleed"] = results.get("is_vulnerable_to_heartbleed", False)
        report["openssl_ccs_injection"] = results.get(
            "is_vulnerable_to_ccs_injection", False
        )
        report["supports_ecdh_key_exchange"] = results.get(
            "supports_ecdh_key_exchange", False
        )
        report["supported_curves"] = results["supported_curves"]

    logging.info(f"Processed SSL scan results: {str(report)}")
    return report


def Server(server_client=requests):


    def wait_timeout(proc, seconds):
        proc.start()
        start = time.time()
        end = start + seconds
        interval = min(seconds / 1000.0, .25)

        while True:
            result = proc.is_alive()
            if not result:
                proc.join()
                return
            if time.time() >= end:
                proc.terminate()
                proc.join()
                raise ScanTimeoutException("Scan timed out")
            time.sleep(interval)


    async def scan(scan_request):

        logging.info("Scan request received")
        inbound_payload = await scan_request.json()

        start_time = dt.datetime.now()
        try:
            domain = inbound_payload["domain"]
            uuid = inbound_payload["uuid"]
            domain_key = inbound_payload["domain_key"]
        except KeyError:
            logging.error(f"Invalid scan request format received: {str(inbound_payload)}")
            return Response("Invalid Format", status_code=400)

        logging.info("Performing scan...")

        try:
            manager = Manager()
            result_dict = manager.dict()
            p = Process(target=scan_ssl, args=(domain, result_dict))
            wait_timeout(p, TIMEOUT)

            scan_results = result_dict.values()[0]

            if scan_results is not None:

                processed_results = process_results(scan_results)

                outbound_payload = json.dumps(
                    {
                        "results": processed_results,
                        "scan_type": "ssl",
                        "uuid": uuid,
                        "domain_key": domain_key,
                    }
                )
                logging.info(f"Scan results: {str(scan_results)}")
            else:
                raise Exception("SSL scan not completed")

        except ScanTimeoutException:
            return Response("Timeout occurred while scanning", status_code=500)

        except ServerHostnameCouldNotBeResolved as e:
            logging.error(f"The designated domain could not be resolved: ({type(e).__name__}: {str(e)})")
            dispatch_results(
                {
                    "scan_type": "ssl",
                    "uuid": uuid,
                    "domain_key": domain_key,
                    "results": {"missing": True},
                },
                server_client,
            )
            return Response("Designated domain could not be resolved", status_code=500)

        end_time = dt.datetime.now()
        elapsed_time = end_time - start_time
        dispatch_results(outbound_payload, server_client)

        logging.info(f"SSL scan completed in {elapsed_time.total_seconds()} seconds.")
        return Response("Scan completed")


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
