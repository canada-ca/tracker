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


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


class TLSScanner:
    domain: str
    ip: str

    def __init__(self, domain, ip_address=None):
        self.domain = domain
        self.ip_address = ip_address

    #
    # def get_server_info(self):
    #     """
    #     Retrieve server connectivity info by performing a connection test
    #     :return: Server connectivity information
    #     """
    #
    #     # Retrieve server information, look-up IP address
    #     server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
    #         self.domain, 443
    #     )
    #     server_tester = ServerConnectivityTester()
    #
    #     logging.info(
    #         f"Testing connectivity with {server_location.hostname}:{server_location.port}..."
    #     )
    #     # Test connection to server and retrieve info
    #     server_info = server_tester.perform(server_location)
    #     logging.info("Server Info %s\n" % server_info)
    #
    #     return server_info

    # def get_supported_tls(self, highest_supported):
    #
    #     supported = [highest_supported]
    #
    #     for version, method in {
    #         "SSL_2_0": TlsVersionEnum.SSLV2,
    #         "SSL_3_0": TlsVersionEnum.SSLV3,
    #         "TLS_1_0": TlsVersionEnum.TLSV1,
    #         "TLS_1_1": TlsVersionEnum.TLSV1_1,
    #         "TLS_1_2": TlsVersionEnum.TLSV1_2,
    #     }.items():
    #
    #         # Only test SSL/TLS connections with lesser versions
    #         if highest_supported == version:
    #             break
    #
    #         try:
    #             # Attempt connection
    #             # If connection fails, exception will be raised, causing the failure to be
    #             # logged and the version to not be appended to the supported list
    #             ctx = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
    #                 self.domain, 443
    #             )
    #             cfg = ServerNetworkConfiguration(self.domain)
    #             connx = SslConnection(ctx, cfg, method, True)
    #             connx.connect(self.domain)
    #             supported.append(version)
    #         except Exception as e:
    #             logging.info(
    #                 f"Failed to connect using %{version}: ({type(e)}) - {e}")
    #
    #     return supported

    def run(self):
        scanner = Scanner()

        designated_scans = set()

        # Scan for common vulnerabilities, certificate info, elliptic curves
        designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
        designated_scans.add(ScanCommand.HEARTBLEED)
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

        # print(json.loads(ServerScanResultAsJson.from_orm(next(scanner.get_results())).json()))

        # res = {
        #     "TLS": {
        #         "supported": tls_supported,
        #         "accepted_cipher_list": [],
        #         "rejected_cipher_list": [],
        #     }
        # }

        print(scan_results.scan_result.ssl_2_0_cipher_suites)

        def get_cipher_names(cipher_suites):
            return [suite.cipher_suite.name for suite in cipher_suites]

        result = {
            "TLS": {
                "accepted_cipher_list": get_cipher_names(
                    scan_results.scan_result.ssl_2_0_cipher_suites.result.accepted_cipher_suites
                    + scan_results.scan_result.ssl_3_0_cipher_suites.result.accepted_cipher_suites
                    + scan_results.scan_result.tls_1_0_cipher_suites.result.accepted_cipher_suites
                    + scan_results.scan_result.tls_1_1_cipher_suites.result.accepted_cipher_suites
                    + scan_results.scan_result.tls_1_2_cipher_suites.result.accepted_cipher_suites
                    + scan_results.scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites),
                "rejected_cipher_list": get_cipher_names(
                    scan_results.scan_result.ssl_2_0_cipher_suites.result.rejected_cipher_suites
                    + scan_results.scan_result.ssl_3_0_cipher_suites.result.rejected_cipher_suites
                    + scan_results.scan_result.tls_1_0_cipher_suites.result.rejected_cipher_suites
                    + scan_results.scan_result.tls_1_1_cipher_suites.result.rejected_cipher_suites
                    + scan_results.scan_result.tls_1_2_cipher_suites.result.rejected_cipher_suites
                    + scan_results.scan_result.tls_1_3_cipher_suites.result.rejected_cipher_suites),
            },
            "is_vulnerable_to_ccs_injection": scan_results.scan_result.openssl_ccs_injection.result.is_vulnerable_to_ccs_injection,
            "is_vulnerable_to_heartbleed": scan_results.scan_result.heartbleed.result.is_vulnerable_to_heartbleed,
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
                # sslyze returns ANSI curve names occaisionally
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
