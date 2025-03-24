import datetime
import json
from dataclasses import dataclass, asdict as dataclass_asdict

import logging

from cryptography.hazmat.primitives._serialization import Encoding
from cryptography.x509 import Certificate
from sslyze.connection_helpers.tls_connection import SslConnection
from sslyze.errors import ServerHostnameCouldNotBeResolved
from sslyze.plugins.certificate_info._certificate_utils import (
    get_common_names,
    parse_subject_alternative_name_extension,
)
from sslyze.plugins.scan_commands import ScanCommand
from sslyze import (
    Scanner,
    ServerScanRequest,
    ServerScanResultAsJson,
    CipherSuiteAcceptedByServer,
    CipherSuiteRejectedByServer,
    TlsResumptionSupportEnum,
    CertificateDeploymentAnalysisResult,
    PathValidationResult,
)
from sslyze.scanner.models import ServerScanResult
from sslyze.server_connectivity import ServerConnectivityInfo
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkConfiguration,
)
from service_identity.cryptography import verify_certificate_hostname
from service_identity.exceptions import VerificationError, CertificateError

from scan.tls_scanner.query_crlite import query_crlite

logger = logging.getLogger(__name__)

CONNECT_TIMEOUT = 2


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
        self.expired_cert = (
            True
            if cert.not_valid_after_utc < datetime.datetime.now(datetime.UTC)
            else False
        )
        self.self_signed_cert = True if cert.issuer == cert.subject else False
        self.not_valid_before = str(cert.not_valid_before_utc)
        self.not_valid_after = str(cert.not_valid_after_utc)
        self.issuer = cert.issuer.rfc4514_string()
        self.subject = cert.subject.rfc4514_string()
        self.common_names = get_common_names(cert.subject)
        self.serial_number = str(cert.serial_number)
        self.signature_hash_algorithm = cert.signature_hash_algorithm.name
        self.san_list = parse_subject_alternative_name_extension(cert).dns_names

        try:
            cert_not_revoked, self.cert_revoked_status = query_crlite(
                cert.public_bytes(Encoding.PEM)
            )
            if type(cert_not_revoked) is bool:
                self.cert_revoked = not cert_not_revoked
        except ValueError as e:
            logger.info(
                f"Error while checking revocation status for {cert.subject.rfc4514_string()}: {str(e)}"
            )


@dataclass
class TrustStoreInfo:
    name: str
    version: str


@dataclass
class PathValidationResultInfo:
    openssl_error_string: str | None
    was_validation_successful: bool
    trust_store: TrustStoreInfo


@dataclass
class CertificateChainInfo:
    path_validation_results: list[PathValidationResultInfo] = None
    bad_hostname: bool = None
    must_have_staple: bool = None
    leaf_certificate_is_ev: bool = None
    received_chain_contains_anchor_certificate: bool = None
    received_chain_has_valid_order: bool = None
    verified_chain_has_sha1_signature: bool = None
    verified_chain_has_legacy_symantec_anchor: bool = None
    certificate_chain: list[CertificateInfo] = None
    passed_validation: bool = None
    has_entrust_certificate: bool = None

    def __init__(
        self,
        cert_deployment: CertificateDeploymentAnalysisResult,
        bad_hostname: bool = None,
    ):
        cert_chain = cert_deployment.received_certificate_chain
        self.bad_hostname = bad_hostname
        self.must_have_staple = (
            cert_deployment.leaf_certificate_has_must_staple_extension
        )
        self.leaf_certificate_is_ev = cert_deployment.leaf_certificate_is_ev
        self.received_chain_contains_anchor_certificate = (
            cert_deployment.received_chain_contains_anchor_certificate
        )
        self.received_chain_has_valid_order = (
            cert_deployment.received_chain_has_valid_order
        )
        self.verified_chain_has_sha1_signature = (
            cert_deployment.verified_chain_has_sha1_signature
        )
        self.verified_chain_has_legacy_symantec_anchor = (
            cert_deployment.verified_chain_has_legacy_symantec_anchor
        )
        self.certificate_chain = [CertificateInfo(cert) for cert in cert_chain]
        self.path_validation_results = self.get_path_validation_result_info(
            cert_deployment.path_validation_results
        )
        self.passed_validation = bool(cert_deployment.received_certificate_chain)
        self.has_entrust_certificate = False
        for cert in self.certificate_chain:
            if any(org in cert.issuer for org in ["O=Entrust", "O=AffirmTrust"]):
                self.has_entrust_certificate = True
                break

    @staticmethod
    def get_path_validation_result_info(
        path_validation_results: list[PathValidationResult],
    ) -> list[PathValidationResultInfo]:
        results = []
        for validation_result in path_validation_results:
            results.append(
                PathValidationResultInfo(
                    openssl_error_string=validation_result.validation_error,
                    was_validation_successful=validation_result.was_validation_successful,
                    trust_store=TrustStoreInfo(
                        name=validation_result.trust_store.name,
                        version=validation_result.trust_store.version,
                    ),
                )
            )
        return results


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
    can_connect_after_scan: bool | None = None
    error: str | None = None

    def __init__(self, domain: str, ip_address: str = None):
        self.request_domain = domain
        self.request_ip_address = ip_address

        scanner = Scanner(per_server_concurrent_connections_limit=1)

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
        # designated_scans.add(ScanCommand.OPENSSL_CCS_INJECTION)
        designated_scans.add(ScanCommand.HEARTBLEED)
        designated_scans.add(ScanCommand.ROBOT)
        designated_scans.add(ScanCommand.SESSION_RESUMPTION)
        designated_scans.add(ScanCommand.SESSION_RENEGOTIATION)
        designated_scans.add(ScanCommand.TLS_FALLBACK_SCSV)
        designated_scans.add(ScanCommand.TLS_COMPRESSION)

        try:
            scan_request = ServerScanRequest(
                server_location=ServerNetworkLocation(
                    hostname=domain,
                    ip_address=ip_address,
                ),
                scan_commands=designated_scans,
                network_configuration=ServerNetworkConfiguration(
                    tls_server_name_indication=domain, network_timeout=CONNECT_TIMEOUT
                ),
            )
        except ServerHostnameCouldNotBeResolved as e:
            logger.info(
                f"Server hostname could not be resolved for domain '{domain}': {str(e)}"
            )
            self.error = f"Server hostname could not be resolved for domain '{domain}'"
            return
        except BaseException as e:
            logger.error(
                f"Unknown server side error when requesting scan for domain '{domain}' at IP '{ip_address}': "
                f"{str(e)}"
            )
            self.error = f"Unknown server side error when requesting scan for domain '{domain}' at IP '{ip_address}'"
            return

        scanner.queue_scans([scan_request])

        # Wait for asynchronous scans to complete
        # get_results() returns a generator with a single "ServerScanResult". We only want that object
        scan_results = [x for x in scanner.get_results()][0]

        self.server_location = getattr(scan_results, "server_location", None)
        self.network_configuration = getattr(
            scan_results, "network_configuration", None
        )

        after_scan_connectivity_info = ServerConnectivityInfo(
            network_configuration=self.network_configuration,
            server_location=self.server_location,
            tls_probing_result=scan_results.connectivity_result,
        )
        after_scan_connection = None
        if (
            not scan_results.connectivity_result
            or scan_results.connectivity_status == "ERROR"
        ):
            self.can_connect_after_scan = False
        else:
            try:
                after_scan_connection = (
                    after_scan_connectivity_info.get_preconfigured_tls_connection()
                )
                after_scan_connection.connect()
                self.can_connect_after_scan = True
            except Exception as e:
                self.can_connect_after_scan = False
                logger.error(
                    f"Error connecting to server after scan for domain '{domain}' at IP '{ip_address}': {str(e)}"
                )
            finally:
                if isinstance(after_scan_connection, SslConnection):
                    after_scan_connection.close()

        self.scan_status = getattr(scan_results, "scan_status", None)
        self.accepted_cipher_suites = self.get_accepted_cipher_suites(scan_results)
        self.accepted_elliptic_curves = self.get_accepted_curves(scan_results)
        self.certificate_chain_info = self.get_certificate_chain_info(scan_results)
        # self.is_vulnerable_to_ccs_injection = self.get_is_vulnerable_to_ccs_injection(scan_results)
        self.is_vulnerable_to_heartbleed = self.get_is_vulnerable_to_heartbleed(
            scan_results
        )
        self.is_vulnerable_to_robot = self.get_is_vulnerable_to_robot(scan_results)
        self.session_resumption_support = self.get_session_resumption_support(
            scan_results
        )
        self.session_renegotiation_support = self.get_session_renegotiation_support(
            scan_results
        )
        self.supports_fallback_scsv = self.get_supports_fallback_scsv(scan_results)
        self.supports_tls_compression = self.get_supports_tls_compression(scan_results)

        if scan_results.connectivity_error_trace:
            connectivity_error_log = f"Error during sslyze connectivity for domain '{domain}' at IP '{ip_address}'"
            try:
                scan_results_as_dict = json.loads(
                    ServerScanResultAsJson.from_orm(scan_results).json()
                )
                logger.info(
                    f"{connectivity_error_log}: {json.dumps(scan_results_as_dict)}"
                )
            except Exception:
                tls_result_string = f"Error converting scan results to JSON - using TLSResult object instead: {self.asdict()}"
                logger.error(f"{connectivity_error_log}: {tls_result_string}")
            self.error = f"Error during sslyze connectivity for domain '{domain}' at IP '{ip_address}'"
            return

    # Convert object to dict
    def asdict(self):
        return dataclass_asdict(self)

    @staticmethod
    def get_accepted_cipher_suites(scan_result: ServerScanResult):
        def get_cipher_suite_name(
            cipher_suites: list[
                CipherSuiteAcceptedByServer | CipherSuiteRejectedByServer
            ],
        ):
            return [suite.cipher_suite.name for suite in cipher_suites]

        try:
            accepted_cipher_suites = AcceptedCipherSuites(
                ssl_2_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.ssl_2_0_cipher_suites.result.accepted_cipher_suites
                ),
                ssl_3_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.ssl_3_0_cipher_suites.result.accepted_cipher_suites
                ),
                tls_1_0_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_0_cipher_suites.result.accepted_cipher_suites
                ),
                tls_1_1_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_1_cipher_suites.result.accepted_cipher_suites
                ),
                tls_1_2_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_2_cipher_suites.result.accepted_cipher_suites
                ),
                tls_1_3_cipher_suites=get_cipher_suite_name(
                    scan_result.scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites
                ),
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
            accepted_curves = [
                convert_to_secg(curve.name)
                for curve in scan_result.scan_result.elliptic_curves.result.supported_curves
            ]
            return accepted_curves
        except AttributeError:
            return []
        except TypeError:
            return []

    @staticmethod
    def get_certificate_chain_info(
        scan_result: ServerScanResult,
    ) -> CertificateChainInfo | None:
        try:
            cert_info = scan_result.scan_result.certificate_info.result
            cert_deployment = cert_info.certificate_deployments[0]
            bad_hostname = None
            try:
                verify_certificate_hostname(
                    cert_deployment.received_certificate_chain[0],
                    scan_result.server_location.hostname,
                )
                bad_hostname = False
            except VerificationError:
                bad_hostname = True
            except CertificateError as e:
                if "Certificate does not contain any `subjectAltName`s." in str(e):
                    bad_hostname = True
                else:
                    print(
                        f"Unknown CertificateError while verifying hostname for '{str(scan_result.server_location.hostname)}': {str(e)}"
                    )
            except Exception as e:
                print(
                    f"Unknown error while verifying hostname for '{str(scan_result.server_location.hostname)}': {str(e)}"
                )
            return CertificateChainInfo(
                cert_deployment=cert_deployment, bad_hostname=bad_hostname
            )
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_ccs_injection(
        scan_result: ServerScanResult,
    ) -> bool | None:
        try:
            is_vulnerable_to_ccs_injection = (
                scan_result.scan_result.openssl_ccs_injection.result.is_vulnerable_to_ccs_injection
            )
            return is_vulnerable_to_ccs_injection
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_heartbleed(scan_result: ServerScanResult) -> bool | None:
        try:
            is_vulnerable_to_heartbleed = (
                scan_result.scan_result.heartbleed.result.is_vulnerable_to_heartbleed
            )
            return is_vulnerable_to_heartbleed
        except AttributeError:
            return None

    @staticmethod
    def get_is_vulnerable_to_robot(scan_result: ServerScanResult) -> str | None:
        try:
            is_vulnerable_to_robot = (
                scan_result.scan_result.robot.result.robot_result.name
            )
            return is_vulnerable_to_robot
        except AttributeError:
            return None

    @staticmethod
    def get_session_resumption_support(
        scan_result: ServerScanResult,
    ) -> SessionResumptionSupport | None:
        try:
            session_id_resumption_support = (
                scan_result.scan_result.session_resumption.result.session_id_resumption_result
            )
            tls_ticket_resumption_support = (
                scan_result.scan_result.session_resumption.result.tls_ticket_resumption_result
            )
            session_resumption_support = SessionResumptionSupport(
                session_id_resumption_support=session_id_resumption_support,
                tls_ticket_resumption_support=tls_ticket_resumption_support,
            )
            return session_resumption_support
        except AttributeError:
            return None

    @staticmethod
    def get_session_renegotiation_support(
        scan_result: ServerScanResult,
    ) -> SessionRenegotiationSupport | None:
        try:
            supports_secure_renegotiation = (
                scan_result.scan_result.session_renegotiation.result.supports_secure_renegotiation
            )
            is_vulnerable_to_client_renegotiation_dos = (
                scan_result.scan_result.session_renegotiation.result.is_vulnerable_to_client_renegotiation_dos
            )
            session_renegotiation_support = SessionRenegotiationSupport(
                supports_secure_renegotiation=supports_secure_renegotiation,
                is_vulnerable_to_client_renegotiation_dos=is_vulnerable_to_client_renegotiation_dos,
            )
            return session_renegotiation_support
        except AttributeError:
            return None

    @staticmethod
    def get_supports_fallback_scsv(scan_result: ServerScanResult) -> bool | None:
        try:
            return (
                scan_result.scan_result.tls_fallback_scsv.result.supports_fallback_scsv
            )
        except AttributeError:
            return None

    @staticmethod
    def get_supports_tls_compression(scan_result: ServerScanResult) -> bool | None:
        try:
            supports_tls_compression = (
                scan_result.scan_result.tls_compression.result.supports_compression
            )
            return supports_tls_compression
        except AttributeError:
            return None


def scan_tls(domain: str, ip_address: str) -> TLSResult:
    return TLSResult(domain, ip_address)
