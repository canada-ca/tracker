import os
import sys
import logging
import scapy
from enum import Enum
from OpenSSL import SSL
from socket import gaierror
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
from pebble import concurrent

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


class TlsVersionEnum(Enum):
    """SSL version constants. (Sourced from OpenSSL)"""

    SSLV2 = 1
    SSLV3 = 2
    TLSV1 = 3
    TLSV1_1 = 4
    TLSV1_2 = 5


class SSLScanner():
    domain = None


    def __init__(self, target_domain):
        self.domain = target_domain


    def get_server_info(self):
        """
        Retrieve server connectivity info by performing a connection test
        :return: Server connectivity information
        """

        # Retrieve server information, look-up IP address
        server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(
            self.domain, 443
        )
        server_tester = ServerConnectivityTester()

        logging.info(
            f"Testing connectivity with {server_location.hostname}:{server_location.port}..."
        )
        # Test connection to server and retrieve info
        server_info = server_tester.perform(server_location)
        logging.info("Server Info %s\n" % server_info)

        return server_info


    def get_supported_tls(self, highest_supported):

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
                    self.domain, 443
                )
                cfg = ServerNetworkConfiguration(self.domain)
                connx = SslConnection(ctx, cfg, method, True)
                connx.connect(self.domain)
                supported.append(version)
            except Exception as e:
                logging.info(f"Failed to connect using %{version}: ({type(e)}) - {e}")

        return supported


    @concurrent.process(timeout=TIMEOUT)
    def run(self):
        try:
            server_info = self.get_server_info()

            highest_tls_supported = str(
                server_info.tls_probing_result.highest_tls_version_supported
            ).split(".")[1]

            tls_supported = self.get_supported_tls(highest_tls_supported)
        except ConnectionToServerFailed as e:
            logging.error(f"Failed to connect to {self.domain}: {e}")
            return {}
        except ServerHostnameCouldNotBeResolved as e:
            logging.error(f"{self.domain} could not be resolved: {e}")
            return {}
        except gaierror as e:
            logging.error(f"Could not retrieve address info for {self.domain} {e}")
            return {}

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
                "accepted_cipher_list": [],
                "rejected_cipher_list": [],
            }
        }

        # Parse scan results for required info
        for name, result in scan_results.scan_commands_results.items():

            # If CipherSuitesScanResults
            if name.endswith("suites"):
                logging.info("Parsing Cipher Suite Scan results...")

                for c in result.accepted_cipher_suites:
                    res["TLS"]["accepted_cipher_list"].append(c.cipher_suite.name)

                for c in result.rejected_cipher_suites:
                    res["TLS"]["rejected_cipher_list"].append(c.cipher_suite.name)

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
                if result.supported_curves is not None:
                    for curve in result.supported_curves:
                        res["supported_curves"].append(curve.name)

        return res
