import re
import traceback
from http.client import HTTPResponse
from typing import List, Optional, Union
from urllib.parse import urlsplit

import sys
import logging
import json
import requests
from requests import Response
from requests_toolbelt.adapters import host_header_ssl
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

TIMEOUT = 10

# logger.error()

@dataclass
class HTTPConnection:
    status_code: int
    redirect_to: str
    headers: dict
    blocked_category: str = None

    def __init__(self, http_response: Response):
        # print("DICT", http_response.__dict__)
        # print("LOCATION", http_response.getheader("location"))
        # print("INFO", http_response.info())
        # print(http_response.geturl())
        # print("CODE", http_response.getcode())
        # print("HEADERS", http_response.getheaders())
        # if 200 <= http_response.status < 300:
        #     self.live = "LIVE"
        # else if 300 <= http_

        self.redirect_to = http_response.headers.get("location", None)
        self.status_code = http_response.status_code
        headers = http_response.headers
        self.headers = dict(http_response.headers)
        if http_response.status_code == 403:
            content = http_response.text
            category_search = re.search("Category: (.*)", content)
            if category_search:
                self.blocked_category = category_search.group(1)


@dataclass
class HTTPSConnection(HTTPConnection):
    HSTS: bool = field(init=False)

    def __init__(self, http_response: Response):
        super().__init__(http_response)
        self.HSTS = True


@dataclass
class HTTPConnectionRequest:
    uri: str
    ip_address: Optional[str]
    connection: HTTPConnection = field(init=False, default=None)
    error: Optional[BaseException]
    scheme: str = "http"

    def __init__(self, uri: str, ip_address: Optional[str] = None,
                 http_response: Optional[Response] = None,
                 error: Optional[BaseException] = None):
        self.uri = uri
        self.ip_address = ip_address
        self.error = error
        if error:
            return
        if self.scheme == "http":
            self.connection = HTTPConnection(http_response=http_response)
        elif self.scheme == "https":
            self.connection = HTTPSConnection(http_response=http_response)


@dataclass(init=False)
class HTTPSConnectionRequest(HTTPConnectionRequest):
    scheme: str = "https"


def get_connection_chain(uri, ip_address):
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = []

    split_uri = urlsplit(uri)
    scheme = split_uri.scheme
    host = split_uri.hostname
    response = None

    if scheme.lower() == "http":
        try:
            with requests.Session() as session:
                if ip_address:
                    req = session.prepare_request(requests.Request("GET", f"http://{ip_address}",
                                           headers={"Host": host}))
                else:
                    req = session.prepare_request(requests.Request("GET", f"http://{host}"))
                response = session.send(req, allow_redirects=False, timeout=10)
                connections.append(HTTPConnectionRequest(uri=uri, ip_address=ip_address, http_response=response))
        except BaseException as e:
            logger.error(f"Error while requesting {uri}:", e)
            connections.append(HTTPConnectionRequest(uri=uri,
                                                      ip_address=ip_address,
                                                      error=e))

    elif scheme.lower() == "https":
        try:
            with requests.Session() as session:
                if ip_address:
                    session.mount("https://",
                                  host_header_ssl.HostHeaderSSLAdapter())
                    req = requests.Request("GET", f"https://{ip_address}", headers={"Host": host})
                else:
                    req = requests.Request("GET", f"https://{host}")

                response = session.send(session.prepare_request(req), allow_redirects=False, timeout=10)
                connections.append(HTTPSConnectionRequest(uri=uri, ip_address=ip_address, http_response=response))
        except BaseException as e:
            logger.error(f"Error while requesting {uri}:", exc_info=True)
            # logger.exception(f"Error while requesting {uri}")
            connections.append(HTTPSConnectionRequest(uri=uri,
                                                      ip_address=ip_address,
                                                      error=e))

    while response and response.next and len(connections) < 10:
        cur_uri = response.next.url
        next_split_uri = urlsplit(cur_uri)
        next_scheme = next_split_uri.scheme

        try:
            response = session.send(response.next, allow_redirects=False, timeout=10)
            if next_scheme.lower() == "http":
                connections.append(
                    HTTPConnectionRequest(uri=cur_uri,
                                          http_response=response))
            elif next_scheme.lower() == "https":
                connections.append(
                    HTTPSConnectionRequest(uri=cur_uri, http_response=response))
        except BaseException as e:
            # logger.error(f"Error while requesting during redirection {uri}:", e)
            logger.exception(f"Error while requesting during redirection {uri}:")
            if next_scheme.lower() == "http":
                connections.append(
                    HTTPConnectionRequest(uri=cur_uri, error=e))
            elif next_scheme.lower() == "https":
                connections.append(
                    HTTPSConnectionRequest(uri=cur_uri, error=e))
            break

    return connections


@dataclass
class ChainResult:
    scheme: str
    domain: str
    uri: str = field(init=False)
    ip_address: str
    has_redirect_loop: bool = field(init=False, default=False)
    connections: list[
        Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = field(
        init=False)

    def __post_init__(self):
        self.uri = f"{self.scheme}://{self.domain}"
        self.connections = get_connection_chain(uri=self.uri,
                                                ip_address=self.ip_address)

        for i in range(len(self.connections) - 1):
            cur_conn = self.connections[i]

            for next_conn in self.connections[i + 1:]:
                if cur_conn.uri == next_conn.uri:
                    self.has_redirection_loop = True
                    break


@dataclass
class HTTPChainScanResult:
    # Use asdict() from dataclasses for dict output of this class

    domain: str
    ip_address: str
    http_chain_result: Optional[ChainResult] = field(init=False)
    https_chain_result: Optional[ChainResult] = field(init=False)

    def __post_init__(self):
        self.http_chain_result = ChainResult(scheme="http",
                                             domain=self.domain,
                                             ip_address=self.ip_address)
        self.https_chain_result = ChainResult(scheme="https",
                                              domain=self.domain,
                                              ip_address=self.ip_address)


class SslyzeScanRequest:
    def __init__(self, sslyze_scan_result: Optional[ServerScanResult] = None,
                 error: Optional[BaseException] = None):
        self.error = error
        if error:
            return
        self.sslyze_scan_result = sslyze_scan_result


class HTTPScanResult:
    http_chain_scan_result: HTTPChainScanResult
    sslyze_scan_result: SslyzeScanRequest

    def __init__(self, http_chain_scan_result: HTTPChainScanResult,
                 sslyze_scan_result: SslyzeScanRequest):
        self.http_chain_scan_result = http_chain_scan_result
        self.sslyze_scan_result = sslyze_scan_result

    def dict(self):
        sslyze_scan_result_dict = json.loads(ServerScanResultAsJson.from_orm(
            self.sslyze_scan_result.sslyze_scan_result).json())
        http__chain_scan_result_dict = asdict(self.http_chain_scan_result)

        return {"sslyze_scan_result": sslyze_scan_result_dict,
                "http_chain_scan_result": http__chain_scan_result_dict}


def run_http_chain_scan(domain, ip_address) -> HTTPChainScanResult:
    http_chain_result = HTTPChainScanResult(domain=domain,
                                            ip_address=ip_address)

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
    http_chain_scan_result = run_http_chain_scan(domain=domain,
                                                 ip_address=ip_address)

    res = HTTPScanResult(sslyze_scan_result=sslyze_scan_result,
                         http_chain_scan_result=http_chain_scan_result)
    return res
