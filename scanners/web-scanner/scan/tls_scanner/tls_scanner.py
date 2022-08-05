import datetime
import json
import os
from dataclasses import dataclass, asdict as dataclass_asdict

import logging

from cryptography.hazmat.primitives._serialization import Encoding
from cryptography.x509 import Certificate
from sslyze.errors import ConnectionToServerFailed, \
    ServerHostnameCouldNotBeResolved
from sslyze.plugins.certificate_info._certificate_utils import get_common_names, extract_dns_subject_alternative_names
from sslyze.plugins.certificate_info.json_output import _CertificateAsJson, \
    _OcspResponseAsJson
from sslyze.plugins.elliptic_curves_plugin import \
    SupportedEllipticCurvesScanResultAsJson, \
    SupportedEllipticCurvesScanAttemptAsJson
from sslyze.plugins.scan_commands import ScanCommand
from sslyze import Scanner, ServerScanRequest, ServerScanResultAsJson, \
    CipherSuiteAcceptedByServer, CipherSuiteRejectedByServer, TlsResumptionSupportEnum, \
    CertificateDeploymentAnalysisResult
from sslyze.scanner.models import CipherSuitesScanAttempt, ServerScanResult
from sslyze.server_setting import (
    ServerNetworkLocation, ServerNetworkConfiguration,
)

from scan.tls_scanner.query_crlite import query_crlite

logger = logging.getLogger()

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


# @dataclass
# class ServerLocation:
#     hostname: str
#     ip_address: str
#     port: int = 443
#
#
# @dataclass
# class NetworkConfiguration:
#     tls_server_name_indication: str
#     tls_opportunistic_encryption: any
#     tls_client_auth_credentials: any
#     xmpp_to_hostname: any
#     network_timeout: int
#     network_max_retries: int


@dataclass
class AcceptedCipherSuites:
    ssl_2_0_cipher_suites: list[str]
    ssl_3_0_cipher_suites: list[str]
    tls_1_0_cipher_suites: list[str]
    tls_1_1_cipher_suites: list[str]
    tls_1_2_cipher_suites: list[str]
    tls_1_3_cipher_suites: list[str]


@dataclass
class CertificateInfo:
    not_valid_before: str = None
    not_valid_after: str = None
    issuer: str = None
    subject: str = None
    expired_cert: bool = None
    self_signed_cert: bool = None
    cert_revoked: bool = None
    cert_revoked_status: str = None
    common_names: list[str] = None
    serial_number: str = None
    signature_hash_algorithm: str = None
    san_list: list[str] = None

    def __init__(self, cert: Certificate):
        self.expired_cert = True if cert.not_valid_after < datetime.datetime.now() else False
        self.self_signed_cert = True if cert.issuer is cert.subject else False
        self.not_valid_before = str(cert.not_valid_before)
        self.not_valid_after = str(cert.not_valid_after)
        self.issuer = cert.issuer.rfc4514_string()
        self.subject = cert.subject.rfc4514_string()
        self.common_names = get_common_names(cert.subject)
        self.serial_number = str(cert.serial_number)
        self.signature_hash_algorithm = cert.signature_hash_algorithm.name
        self.san_list = extract_dns_subject_alternative_names(cert)

        try:
            cert_not_revoked, self.cert_revoked_status = query_crlite(cert.public_bytes(Encoding.PEM))
            if type(cert_not_revoked) is bool:
                self.cert_revoked = not cert_not_revoked
        except ValueError as e:
            logging.info(
                f"Error while checking revocation status for {cert.subject.rfc4514_string()}: {str(e)}"
            )


@dataclass
class CertificateChainInfo:
    bad_hostname: bool = None
    must_have_staple: bool = None
    leaf_certificate_is_ev: bool = None
    received_chain_contains_anchor_certificate: bool = None
    received_chain_has_valid_order: bool = None
    verified_chain_has_sha1_signature: bool = None
    verified_chain_has_legacy_symantec_anchor: bool = None
    certificate_info_chain: list[CertificateInfo] = None

    def __init__(self, cert_deployment: CertificateDeploymentAnalysisResult):
        cert_chain = cert_deployment.received_certificate_chain
        self.bad_hostname = not cert_deployment.leaf_certificate_subject_matches_hostname
        self.must_have_staple = cert_deployment.leaf_certificate_has_must_staple_extension
        self.leaf_certificate_is_ev = cert_deployment.leaf_certificate_is_ev
        self.received_chain_contains_anchor_certificate = cert_deployment.received_chain_contains_anchor_certificate
        self.received_chain_has_valid_order = cert_deployment.received_chain_has_valid_order
        self.verified_chain_has_sha1_signature = cert_deployment.verified_chain_has_sha1_signature
        self.verified_chain_has_legacy_symantec_anchor = cert_deployment.verified_chain_has_legacy_symantec_anchor
        self.certificate_info_chain = [CertificateInfo(cert) for cert in cert_chain]


@dataclass
class SessionResumptionSupport:
    session_id_resumption_support: TlsResumptionSupportEnum
    tls_ticket_resumption_support: TlsResumptionSupportEnum


@dataclass
class SessionRenegotiationSupport:
    supports_secure_renegotiation: bool
    is_vulnerable_to_client_renegotiation_dos: bool


@dataclass
class TLSResult:
    # Use asdict() from dataclasses for dict output of this class
    request_domain: str
    request_ip_address: str
    server_location: ServerNetworkLocation | None = None
    network_configuration: ServerNetworkConfiguration | None = None
    scan_status: str | None = None
    accepted_cipher_suites: list[str] | None = None
    accepted_elliptic_curves: list[str] | None = None
    certificate_chain_info: CertificateChainInfo | None = None
    is_vulnerable_to_ccs_injection: bool | None = None
    is_vulnerable_to_heartbleed: bool | None = None
    is_vulnerable_to_robot: str | None = None
    session_resumption_support: SessionResumptionSupport | None = None
    session_renegotiation_support: SessionRenegotiationSupport | None = None
    supports_fallback_scsv: bool | None = None
    supports_tls_compression: bool | None = None
    error: str | None = None

    def __init__(self, domain: str, ip_address: str = None):
        self.request_domain = domain
        self.request_ip_address = ip_address

        scanner = Scanner()

        designated_scans = set()

        # Test supported SSL/TLS
        designated_scans.add(ScanCommand.SSL_2_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.SSL_3_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_0_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_1_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_2_CIPHER_SUITES)
        designated_scans.add(ScanCommand.TLS_1_3_CIPHER_SUITES)
        designated_scans.add(ScanCommand.ELLIPTIC_CURVES)

        # Scan for common vulnerabilities, certificate info, elliptic curves, etc
        designated_scans.add(ScanCommand.CERTIFICATE_INFO)
        designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
        designated_scans.add(ScanCommand.HEARTBLEED)
        designated_scans.add(ScanCommand.ROBOT)
        designated_scans.add(ScanCommand.SESSION_RESUMPTION)
        designated_scans.add(ScanCommand.SESSION_RENEGOTIATION)
        designated_scans.add(ScanCommand.TLS_FALLBACK_SCSV)
        designated_scans.add(ScanCommand.TLS_COMPRESSION)

        try:
            scan_request = ServerScanRequest(
                server_location=ServerNetworkLocation(hostname=domain,
                                                      ip_address=ip_address),
                scan_commands=designated_scans
            )
        except ServerHostnameCouldNotBeResolved as e:
            logger.info(f"Server hostname could not be resolved for domain '{domain}': {str(e)}")
            self.error = f"Server hostname could not be resolved for domain '{domain}'"
            return
        except BaseException as e:
            logger.error(f"Unknown server side error when requesting scan for domain '{domain}' at IP '{ip_address}': "f"{str(e)}")
            self.error = f"Unknown server side error when requesting scan for domain '{domain}' at IP '{ip_address}'"
            return

        scanner.queue_scans([scan_request])

        # Wait for asynchronous scans to complete
        # get_results() returns a generator with a single "ServerScanResult". We only want that object
        scan_results = [x for x in scanner.get_results()][0]

        self.server_location = getattr(scan_results, "server_location", None)
        self.network_configuration = getattr(scan_results, "network_configuration", None)
        self.scan_status = getattr(scan_results, "scan_status", None)
        self.accepted_cipher_suites = self.get_accepted_cipher_suites(scan_results)
        self.accepted_elliptic_curves = self.get_accepted_curves(scan_results)
        self.certificate_chain_info = self.get_certificate_chain_info(scan_results)
        self.is_vulnerable_to_ccs_injection = self.get_is_vulnerable_to_ccs_injection(scan_results)
        self.is_vulnerable_to_heartbleed = self.get_is_vulnerable_to_heartbleed(scan_results)
        self.is_vulnerable_to_robot = self.get_is_vulnerable_to_robot(scan_results)
        self.session_resumption_support = self.get_session_resumption_support(scan_results)
        self.session_renegotiation_support = self.get_session_renegotiation_support(scan_results)
        self.supports_fallback_scsv = self.get_supports_fallback_scsv(scan_results)
        self.supports_tls_compression = self.get_supports_tls_compression(scan_results)

        scan_results_as_dict = json.loads(ServerScanResultAsJson.from_orm(scan_results).json())

        if scan_results.connectivity_error_trace:
            logger.info(f"Error during sslyze connectivity for domain '{domain}' at IP '{ip_address}': {json.dumps(scan_results_as_dict)}")
            self.error = f"Error during sslyze connectivity for domain '{domain}' at IP '{ip_address}'"
            return

    # Convert object to dict
    def asdict(self):
        return dataclass_asdict(self)

    @staticmethod
    def get_accepted_cipher_suites(scan_result: ServerScanResult):

        def get_cipher_suite_name(cipher_suites: list[CipherSuiteAcceptedByServer | CipherSuiteRejectedByServer]):
            return [suite.cipher_suite.name for suite in cipher_suites]

        try:
            accepted_cipher_suites = AcceptedCipherSuites(
                ssl_2_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.ssl_2_0_cipher_suites.result.accepted_cipher_suites),
                ssl_3_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.ssl_3_0_cipher_suites.result.accepted_cipher_suites),
                tls_1_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_0_cipher_suites.result.accepted_cipher_suites),
                tls_1_1_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_1_cipher_suites.result.accepted_cipher_suites),
                tls_1_2_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_2_cipher_suites.result.accepted_cipher_suites),
                tls_1_3_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites),
            )
            return accepted_cipher_suites
        except AttributeError:
            return None

    @staticmethod
    def get_accepted_curves(scan_result: ServerScanResult) -> list[str] | None:
        # sslyze returns ANSI curve names occasionally
        # In at least these two cases we can simply convert to
        # using the equivalent SECG name, so that this aligns
        # with CCCS guidance:
        # https://datatracker.ietf.org/doc/html/rfc4492#appendix-A
        def convert_to_secg(curve: str):
            match curve:
                case "prime192v1":
                    return "secp192r1"
                case "prime256v1":
                    return "secp256r1"
                case _:
                    return curve

        try:
            accepted_curves = [convert_to_secg(curve.name) for curve in scan_result.scan_result.elliptic_curves.result.supported_curves]
            return accepted_curves
        except AttributeError:
            return None

    @staticmethod
    def get_certificate_chain_info(scan_result: ServerScanResult) -> CertificateChainInfo | None:
        try:
            cert_info = scan_result.scan_result.certificate_info.result
            cert_deployment = cert_info.certificate_deployments[0]
            return CertificateChainInfo(cert_deployment)
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_ccs_injection(scan_result: ServerScanResult) -> bool | None:
        try:
            is_vulnerable_to_ccs_injection = scan_result.scan_result.openssl_ccs_injection.result.is_vulnerable_to_ccs_injection
            return is_vulnerable_to_ccs_injection
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_heartbleed(scan_result: ServerScanResult) -> bool | None:
        try:
            is_vulnerable_to_heartbleed = scan_result.scan_result.heartbleed.result.is_vulnerable_to_heartbleed
            return is_vulnerable_to_heartbleed
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_robot(scan_result: ServerScanResult) -> str | None:
        try:
            is_vulnerable_to_robot = scan_result.scan_result.robot.result.robot_result.name
            return is_vulnerable_to_robot
        except AttributeError:
            return None

    @staticmethod
    def get_session_resumption_support(scan_result: ServerScanResult) -> SessionResumptionSupport | None:
        try:
            session_id_resumption_support = scan_result.scan_result.session_resumption.result.session_id_resumption_result
            tls_ticket_resumption_support = scan_result.scan_result.session_resumption.result.tls_ticket_resumption_result
            session_resumption_support = SessionResumptionSupport(
                session_id_resumption_support=session_id_resumption_support,
                tls_ticket_resumption_support=tls_ticket_resumption_support
            )
            return session_resumption_support
        except AttributeError:
            return None

    @staticmethod
    def get_session_renegotiation_support(scan_result: ServerScanResult) -> SessionRenegotiationSupport | None:
        try:
            supports_secure_renegotiation = scan_result.scan_result.session_renegotiation.result.supports_secure_renegotiation
            is_vulnerable_to_client_renegotiation_dos = scan_result.scan_result.session_renegotiation.result.is_vulnerable_to_client_renegotiation_dos
            session_renegotiation_support = SessionRenegotiationSupport(
                supports_secure_renegotiation=supports_secure_renegotiation,
                is_vulnerable_to_client_renegotiation_dos=is_vulnerable_to_client_renegotiation_dos
            )
            return session_renegotiation_support
        except AttributeError:
            return None

    @staticmethod
    def get_supports_fallback_scsv(scan_result: ServerScanResult) -> bool | None:
        try:
            return scan_result.scan_result.tls_fallback_scsv.result.supports_fallback_scsv
        except AttributeError:
            return None

    @staticmethod
    def get_supports_tls_compression(scan_result: ServerScanResult) -> bool | None:
        try:
            supports_tls_compression = scan_result.scan_result.tls_compression.result.supports_compression
            return supports_tls_compression
        except AttributeError:
            return None


def scan_tls(domain: str, ip_address: str) -> TLSResult:
    return TLSResult(domain, ip_address)
