import json
import os
from typing import Union

import sys
import logging
from enum import Enum
from OpenSSL import SSL
from socket import gaierror

from cryptography.x509 import Certificate
from sslyze.errors import ConnectionToServerFailed, \
    ServerHostnameCouldNotBeResolved
from sslyze.plugins.certificate_info._certificate_utils import get_common_names
from sslyze.plugins.certificate_info.json_output import _CertificateAsJson, \
    _OcspResponseAsJson
from sslyze.plugins.elliptic_curves_plugin import \
    SupportedEllipticCurvesScanResultAsJson, \
    SupportedEllipticCurvesScanAttemptAsJson
from sslyze.plugins.scan_commands import ScanCommand
from sslyze import Scanner, ServerScanRequest, ServerScanResultAsJson, \
    CipherSuiteAcceptedByServer, CipherSuiteRejectedByServer
from sslyze.scanner.models import CipherSuitesScanAttempt, ServerScanResult
from sslyze.server_setting import (
    ServerNetworkLocation,
)

logger = logging.getLogger()

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
        scan_results_as_dict = json.loads(ServerScanResultAsJson.from_orm(scan_results).json())

        if scan_results.connectivity_error_trace:
            logger.error(f"Error during sslyze connectivity: {json.dumps(scan_results_as_dict)}")
            return

        def get_accepted_cipher_suite_names(scan_result: ServerScanResult):
            if not scan_result.scan_result:
                return None

            def get_names(cipher_suites):
                return [suite.cipher_suite.name for suite in cipher_suites]

            accepted_cipher_suites = {
                "ssl_2_0_cipher_suites": get_names(
                    scan_result.scan_result.ssl_2_0_cipher_suites.result.accepted_cipher_suites),
                "ssl_3_0_cipher_suites": get_names(
                    scan_result.scan_result.ssl_3_0_cipher_suites.result.accepted_cipher_suites),
                "tls_1_0_cipher_suites": get_names(
                    scan_result.scan_result.tls_1_0_cipher_suites.result.accepted_cipher_suites),
                "tls_1_1_cipher_suites": get_names(
                    scan_result.scan_result.tls_1_1_cipher_suites.result.accepted_cipher_suites),
                "tls_1_2_cipher_suites": get_names(
                    scan_result.scan_result.tls_1_2_cipher_suites.result.accepted_cipher_suites),
                "tls_1_3_cipher_suites": get_names(
                    scan_result.scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites),
            }

            return accepted_cipher_suites

        def get_certificate_info(certificate: Certificate):
            certificate_json = json.loads(_CertificateAsJson.from_orm(certificate).json())
            certificate_json["subject"]["common_names"] = get_common_names(
                certificate.subject)
            certificate_json["subject"]["common_names"] = get_common_names(
                certificate.issuer)
            return certificate_json

        def get_limited_certificate_info(certificate: Certificate):
            certificate_json = json.loads(_CertificateAsJson.from_orm(certificate).json())

            return {
                "fingerprint_sha256": certificate_json["fingerprint_sha256"],
                "serial_number": certificate_json["serial_number"],
                "subject": {
                    "rfc4514_string": certificate_json["subject"]["rfc4514_string"]
                },
                "issuer": {
                    "rfc4514_string": certificate_json["issuer"]["rfc4514_string"]
                }

            }

        def get_certificate_scan_info(scan_result: ServerScanResult):
            if not scan_result.scan_result:
                return None

            certificate_info = scan_result.scan_result.certificate_info

            return {
                "hostname_used_for_server_name_indication": certificate_info.result.hostname_used_for_server_name_indication,
                "certificate_deployments": [
                    {
                        "received_certificate_chain": [
                            get_certificate_info(received_certificate)
                            for received_certificate in
                            certificate_deployment.received_certificate_chain
                        ],
                        "leaf_certificate_subject_matches_hostname": certificate_deployment.leaf_certificate_subject_matches_hostname,
                        "leaf_certificate_has_must_staple_extension": certificate_deployment.leaf_certificate_has_must_staple_extension,
                        "leaf_certificate_is_ev": certificate_deployment.leaf_certificate_is_ev,
                        "leaf_certificate_signed_certificate_timestamps_count": certificate_deployment.leaf_certificate_signed_certificate_timestamps_count,
                        "received_chain_contains_anchor_certificate": certificate_deployment.received_chain_contains_anchor_certificate,
                        "received_chain_has_valid_order": certificate_deployment.received_chain_has_valid_order,
                        "path_validation_results": [
                            {
                                "trust_store": {
                                    "name": validation_result.trust_store.name,
                                    "version": validation_result.trust_store.version,
                                },
                                "verified_certificate_chain": [
                                    get_limited_certificate_info(
                                        verified_certificate)
                                    for verified_certificate in
                                    validation_result.verified_certificate_chain
                                ],
                                "openssl_error_string": validation_result.openssl_error_string,
                                "was_validation_successful": validation_result.was_validation_successful
                            }
                            for validation_result in
                            certificate_deployment.path_validation_results
                        ],
                        "verified_chain_has_sha1_signature": certificate_deployment.verified_chain_has_sha1_signature,
                        "verified_chain_has_legacy_symantec_anchor": certificate_deployment.verified_chain_has_legacy_symantec_anchor,
                        "ocsp_response": json.loads(_OcspResponseAsJson.from_orm(certificate_deployment.ocsp_response).json()),
                        "ocsp_response_is_trusted": certificate_deployment.ocsp_response_is_trusted,
                        "verified_certificate_chain": [
                            get_limited_certificate_info(verified_certificate)
                            for verified_certificate in
                            certificate_deployment.verified_certificate_chain
                        ],
                    }
                    for certificate_deployment in
                    certificate_info.result.certificate_deployments
                ]
            }



        certificate_info = get_certificate_scan_info(scan_results)
        accepted_cipher_suites = get_accepted_cipher_suite_names(scan_results)
        is_vulnerable_to_ccs_injection = scan_results.scan_result.openssl_ccs_injection.result.is_vulnerable_to_ccs_injection
        is_vulnerable_to_heartbleed = scan_results.scan_result.heartbleed.result.is_vulnerable_to_heartbleed
        is_vulnerable_to_robot = scan_results.scan_result.robot.result.robot_result.name

        elliptic_curves = {
            "status": scan_results.scan_result.elliptic_curves.status,
            "error_reason": scan_results.scan_result.elliptic_curves.error_reason,
            "result": None
        }
        if scan_results.scan_result.elliptic_curves.status == "ERROR":
            logger.error(f"Error while scanning elliptic curves for domain '{self.domain}' at IP {self.ip_address}: {json.dumps(scan_results_as_dict['scan_result']['elliptic_curves'])}")
        else:
            elliptic_curves["result"] = []
            if scan_results.scan_result.elliptic_curves.result.supported_curves is not None:
                for curve in scan_results.scan_result.elliptic_curves.result.supported_curves:
                    # sslyze returns ANSI curve names occasionally
                    # In at least these two cases we can simply convert to
                    # using the equivalent SECG name, so that this aligns
                    # with CCCS guidance:
                    # https://datatracker.ietf.org/doc/html/rfc4492#appendix-A
                    if curve.name == "prime192v1":
                        elliptic_curves["result"].append("secp192r1")
                    elif curve.name == "prime256v1":
                        elliptic_curves["result"].append("secp256r1")
                    else:
                        elliptic_curves["result"].append(curve.name)

        result = {
            "server_location": scan_results_as_dict["server_location"],
            "network_configuration": scan_results_as_dict["network_configuration"],
            "connectivity_status": scan_results_as_dict["connectivity_status"],
            "connectivity_error_trace": scan_results_as_dict["connectivity_error_trace"],
            "connectivity_result": scan_results_as_dict["connectivity_result"],
            "scan_status": scan_results_as_dict["scan_status"],
            "accepted_cipher_suites": accepted_cipher_suites,
            "certificate_info": certificate_info,
            "elliptic_curves": elliptic_curves,
            "is_vulnerable_to_ccs_injection": is_vulnerable_to_ccs_injection,
            "is_vulnerable_to_heartbleed": is_vulnerable_to_heartbleed,
            "is_vulnerable_to_robot": is_vulnerable_to_robot,
        }

        return result
