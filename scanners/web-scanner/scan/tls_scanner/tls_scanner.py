import json
import os
from typing import Union

import sys
import logging
from enum import Enum
from OpenSSL import SSL
from socket import gaierror
from sslyze.errors import ConnectionToServerFailed, \
    ServerHostnameCouldNotBeResolved
from sslyze.plugins.scan_commands import ScanCommand
from sslyze import Scanner, ServerScanRequest, ServerScanResultAsJson, \
    CipherSuiteAcceptedByServer, CipherSuiteRejectedByServer
from sslyze.server_setting import (
    ServerNetworkLocation,
)

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


class TLSScanner:
    domain: str
    ip: str

    def __init__(self, domain, ip_address=None):
        self.domain = domain
        self.ip_address = ip_address

    def run(self):
        scanner = Scanner()

        designated_scans = set()

        # Scan for common vulnerabilities, certificate info, elliptic curves
        designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
        designated_scans.add(ScanCommand.HEARTBLEED)
        designated_scans.add(ScanCommand.ROBOT)
        designated_scans.add(ScanCommand.CERTIFICATE_INFO)
        designated_scans.add(ScanCommand.ELLIPTIC_CURVES)

        # Test supported SSL/TLS
        designated_scans.add(ScanCommand.SSL_2_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.SSL_3_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_1_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_2_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_3_CIPHER_SUITES)

        scan_request = ServerScanRequest(
            server_location=ServerNetworkLocation(hostname=self.domain,
                                                  ip_address=self.ip_address),
            scan_commands=designated_scans
        )

        scanner.queue_scans([scan_request])

        # Wait for asynchronous scans to complete
        # get_results() returns a generator with a single "ServerScanResult". We only want that object
        scan_results = [x for x in scanner.get_results()][0]

        def get_cipher_names(cipher_suites):
            return [suite.cipher_suite.name for suite in cipher_suites]

        result = {
            "domain": scan_results.server_location.hostname,
            "ipaddress": scan_results.server_location.ip_address,
            "TLS": {
                "ssl_2_0_cipher_suites": get_cipher_names(scan_results.scan_result.ssl_2_0_cipher_suites.result.accepted_cipher_suites),
                "ssl_3_0_cipher_suites": get_cipher_names(scan_results.scan_result.ssl_3_0_cipher_suites.result.accepted_cipher_suites),
                "tls_1_0_cipher_suites": get_cipher_names(scan_results.scan_result.tls_1_0_cipher_suites.result.accepted_cipher_suites),
                "tls_1_1_cipher_suites": get_cipher_names(scan_results.scan_result.tls_1_1_cipher_suites.result.accepted_cipher_suites),
                "tls_1_2_cipher_suites": get_cipher_names(scan_results.scan_result.tls_1_2_cipher_suites.result.accepted_cipher_suites),
                "tls_1_3_cipher_suites": get_cipher_names(scan_results.scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites),
            },
            "certificate_info": json.loads(ServerScanResultAsJson.from_orm(scan_results).json()),
            "is_vulnerable_to_ccs_injection": scan_results.scan_result.openssl_ccs_injection.result.is_vulnerable_to_ccs_injection,
            "is_vulnerable_to_heartbleed": scan_results.scan_result.heartbleed.result.is_vulnerable_to_heartbleed,
            "is_vulnerable_to_robot": scan_results.scan_result.robot.result.robot_result,
            "supports_ecdh_key_exchange": scan_results.scan_result.elliptic_curves.result.supports_ecdh_key_exchange
        }

        try:
            result["signature_algorithm"] = (
                scan_results.scan_result.certificate_info.result.certificate_deployments[0]
                    .verified_certificate_chain[0]
                    .signature_hash_algorithm.__class__.__name__
            )
        except TypeError:
            result["signature_algorithm"] = None

        result["supported_curves"] = []
        if scan_results.scan_result.elliptic_curves.result.supported_curves is not None:
            for curve in scan_results.scan_result.elliptic_curves.result.supported_curves:
                # sslyze returns ANSI curve names occasionally
                # In at least these two cases we can simply convert to
                # using the equivalent SECG name, so that this aligns
                # with CCCS guidance:
                # https://datatracker.ietf.org/doc/html/rfc4492#appendix-A
                if curve.name == "prime192v1":
                    result["supported_curves"].append("secp192r1")
                elif curve.name == "prime256v1":
                    result["supported_curves"].append("secp256r1")
                else:
                    result["supported_curves"].append(curve.name)

        return result
