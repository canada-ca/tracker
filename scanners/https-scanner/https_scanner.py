import traceback
from http.client import HTTPResponse
from typing import List, Optional

import sys
import logging
import json
from dataclasses import dataclass, field, asdict
from sslyze import Scanner, ServerScanRequest, ServerScanResultAsJson, \
    ScanCommandResult, ServerScanResult
from sslyze.connection_helpers.http_request_generator import \
    HttpRequestGenerator
from sslyze.connection_helpers.http_response_parser import HttpResponseParser
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.errors import ServerHostnameCouldNotBeResolved
from sslyze.server_connectivity import check_connectivity_to_server, \
    ServerConnectivityInfo
from sslyze.server_setting import (
    ServerNetworkLocation,
    ServerNetworkConfiguration,
)

logger = logging.getLogger(__name__)
# from scan import https


# @dataclass
# class HTTPConnection:
#     http_response: HTTPResponse
#     live: bool = field(init=False)
#     redirect_to: str = field(init=False)
#
#     def __post_init__(self):
#         self.live = False
#         self.redirect_to = self.http_response.headers.get("location", None)


@dataclass
class HTTPConnection:
    live: bool
    redirect_to: str

    def __init__(self, http_response: HTTPResponse):
        content = http_response.read1()
        # print("DICT", http_response.__dict__)
        # print("LOCATION", http_response.getheader("location"))
        # print("INFO", http_response.info())
        # print(http_response.geturl())
        # print("CODE", http_response.getcode())
        # print("HEADERS", http_response.getheaders())

        self.live = False
        self.redirect_to = http_response.headers.get("location", None)


@dataclass()
class HTTPResult(ScanCommandResult):
    request_uri: str
    ip_address: str
    live: bool = field(init=False)
    connections: list[HTTPConnection] = field(init=False)

    def __post_init__(self):
        self.live = False


@dataclass
class HTTPSConnection(HTTPConnection):
    HSTS: bool = field(init=False)

    def __init__(self, http_response: HTTPResponse):
        super().__init__(http_response=http_response)
        self.HSTS = True


@dataclass
class HTTPSConnectionRequest:
    request_uri: str
    ip_address: str
    https_connection: HTTPSConnection
    error: Optional[Exception]

    def __init__(self, request_uri: str, ip_address: str, http_response: Optional[HTTPResponse] = None, error: Optional[Exception] = None):
        self.request_uri = request_uri
        self.ip_address = ip_address
        self.error = error
        if error:
            return
        self.https_connection = HTTPSConnection(http_response=http_response)


@dataclass()
class HTTPSResult(HTTPResult):
    connections: list[HTTPSConnectionRequest] = field(init=False)

    def __post_init__(self):
        super().__post_init__()
        self.connections = [self.get_https_connection(request_uri=self.request_uri, ip_address=self.ip_address)]

    @staticmethod
    def get_https_connection(request_uri, ip_address) -> HTTPSConnectionRequest:
        try:
            server_location = ServerNetworkLocation(
                hostname=request_uri, ip_address=ip_address)
            network_configuration = ServerNetworkConfiguration.default_for_server_location(
                server_location)

            tls_probing_result = check_connectivity_to_server(
                server_location=server_location,
                network_configuration=network_configuration)
            server_connectivity_info = ServerConnectivityInfo(
                server_location=server_location,
                network_configuration=network_configuration,
                tls_probing_result=tls_probing_result)

            tls_connection = server_connectivity_info.get_preconfigured_tls_connection()
            tls_connection.connect()
        except Exception as e:
            logger.error(
                f"HTTPS scanner could not connect to {server_location.hostname}: {e}")
            return HTTPSConnectionRequest(request_uri=request_uri, ip_address=ip_address, error=e)

        try:
            request = HttpRequestGenerator.get_request(
                    host=server_connectivity_info.network_configuration.tls_server_name_indication,

                )
            print(request)
            tls_connection.ssl_client.write(request)

            http_response = HttpResponseParser.parse_from_ssl_connection(
                tls_connection.ssl_client)
        except BaseException as e:
            logger.error(
                f"Error requesting content from {server_location.hostname}.")
        finally:
            tls_connection.close()

        return HTTPSConnectionRequest(request_uri=request_uri, ip_address=server_location.ip_address, http_response=http_response)


@dataclass
class HTTPChainScanResult:
    # Use asdict() from dataclasses for dict output of this class

    domain: str
    ip_address: str
    # http_chain_result: HTTPResult = field(init=False)
    https_chain_result: Optional[HTTPSResult] = field(init=False)

    def __post_init__(self):
        self.https_chain_result = HTTPSResult(request_uri=self.domain, ip_address=self.ip_address)


class SslyzeScanRequest:
    def __init__(self, sslyze_scan_result: Optional[ServerScanResult] = None, error: Optional[Exception] = None):
        self.error = error
        if error:
            return
        self.sslyze_scan_result = sslyze_scan_result


class HTTPScanResult:
    http_chain_scan_result: HTTPChainScanResult
    sslyze_scan_result: SslyzeScanRequest

    def __init__(self, http_chain_scan_result: HTTPChainScanResult, sslyze_scan_result: SslyzeScanRequest):
        self.http_chain_scan_result = http_chain_scan_result
        self.sslyze_scan_result = sslyze_scan_result

    def dict(self):
        sslyze_scan_result_dict = json.loads(ServerScanResultAsJson.from_orm(self.sslyze_scan_result.sslyze_scan_result).json())
        http__chain_scan_result_dict = asdict(self.http_chain_scan_result)

        return {"sslyze_scan_result": sslyze_scan_result_dict, "http_chain_scan_result": http__chain_scan_result_dict}


def run_http_chain_scan(domain, ip_address) -> HTTPChainScanResult:
    http_chain_result = HTTPChainScanResult(domain=domain, ip_address=ip_address)

    return http_chain_result


def run_sslyze_scan(domain, ip_address) -> SslyzeScanRequest:
    try:
        server_location = ServerNetworkLocation(
            hostname=domain, ip_address=ip_address)
        network_configuration = ServerNetworkConfiguration.default_for_server_location(
            server_location)

        all_scan_requests = [
            ServerScanRequest(server_location=server_location,
                              network_configuration=network_configuration,
                              scan_commands={ScanCommand.CERTIFICATE_INFO}),
        ]
    except ServerHostnameCouldNotBeResolved as e:
        # Handle bad input ie. invalid hostnames
        logger.error(f"Sslyze could not resolve hostname: {e}")
        return SslyzeScanRequest(error=e)

    scanner = Scanner()
    scanner.queue_scans(all_scan_requests)

    # We only scan one domain at a time, so we get the first entry
    return SslyzeScanRequest(
        sslyze_scan_result=[result for result in scanner.get_results()][0])


def scan_http(domain, ip_address=None):
    sslyze_scan_result = run_sslyze_scan(domain=domain, ip_address=ip_address)
    http_chain_scan_result = run_http_chain_scan(domain=domain, ip_address=ip_address)

    res = HTTPScanResult(sslyze_scan_result=sslyze_scan_result, http_chain_scan_result=http_chain_scan_result)
    return res
