import re
from typing import Optional, Union
from urllib.parse import urlsplit

import logging
import requests
from requests import Response, PreparedRequest
from requests.exceptions import ConnectTimeout, ConnectionError
from requests_toolbelt.adapters import host_header_ssl
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)

TIMEOUT = 10

CONNECTION_ERROR = "CONNECTION_ERROR"
TIMEOUT_ERROR = "TIMEOUT_ERROR"
UNKNOWN_ERROR = "UNKNOWN_ERROR"

DEFAULT_REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0"}


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
    connection: HTTPConnection = field(init=False, default=None)
    error: Optional[str]
    scheme: str = "http"

    def __init__(self, uri: str,
                 http_response: Optional[Response] = None,
                 error: Optional[str] = None):
        self.uri = uri
        self.error = str(error)
        if error:
            return
        if self.scheme == "http":
            self.connection = HTTPConnection(http_response=http_response)
        elif self.scheme == "https":
            self.connection = HTTPSConnection(http_response=http_response)


@dataclass(init=False)
class HTTPSConnectionRequest(HTTPConnectionRequest):
    scheme: str = "https"


def request_connection(uri: Optional[str] = None,
                       ip_address: Optional[str] = None,
                       prepared_request: Optional[PreparedRequest] = None):
    uri = uri or prepared_request.url
    split_uri = urlsplit(uri)
    scheme = split_uri.scheme
    host = split_uri.hostname
    response = None
    context = f"while requesting {uri}" if not prepared_request else f"while requesting {uri} during redirect"



    with requests.Session() as session:
        try:
            if prepared_request:
                req = prepared_request
                prepared_request_host = urlsplit(prepared_request.url).hostname
            else:
                if scheme.lower() == "https":
                    session.mount("https://", host_header_ssl.HostHeaderSSLAdapter())

                if ip_address:
                    req = session.prepare_request(requests.Request("GET", f"{scheme.lower()}://{ip_address}",
                                                               headers={"Host": host}))
                else:
                    req = session.prepare_request(requests.Request("GET", f"{scheme.lower()}://{host}"))

            response = session.send(req, allow_redirects=False, timeout=TIMEOUT)

            if scheme.lower() == "http":
                connection = HTTPConnectionRequest(uri=uri, http_response=response)
            elif scheme.lower() == "https":
                connection = HTTPSConnectionRequest(uri=uri, http_response=response)
            return {"connection": connection, "response": response}

        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout error {context}: {str(e)}")
            if scheme.lower() == "http":
                connection = HTTPConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
            elif scheme.lower() == "https":
                connection = HTTPSConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
            return {"connection": connection, "response": response}

        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error {context}: {str(e)}")
            if scheme.lower() == "http":
                connection = HTTPConnectionRequest(uri=uri, error=CONNECTION_ERROR)
            elif scheme.lower() == "https":
                connection = HTTPSConnectionRequest(uri=uri, error=CONNECTION_ERROR)
            return {"connection": connection, "response": response}

        except BaseException as e:
            logger.error(f"Unknown error {context}: {str(e)}")
            if scheme.lower() == "http":
                connection = HTTPConnectionRequest(uri=uri, error=UNKNOWN_ERROR)
            elif scheme.lower() == "https":
                connection = HTTPSConnectionRequest(uri=uri, error=UNKNOWN_ERROR)
            return {"connection": connection, "response": response}


def get_connection_chain(uri, ip_address):
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = []

    connection_request = request_connection(uri=uri, ip_address=ip_address)
    connection = connection_request.get("connection")
    connections.append(connection)
    response = connection_request.get("response")

    while response and response.next and len(connections) < 10:
        response.next.headers.pop("Host")
        connection_request = request_connection(prepared_request=response.next)
        connection = connection_request.get("connection")
        connections.append(connection)
        response = connection_request.get("response")

    # response = connections[0].


    #
    # if scheme.lower() == "http":
    #     try:
    #         with requests.Session() as session:
    #             if ip_address:
    #                 req = session.prepare_request(requests.Request("GET", f"http://{ip_address}",
    #                                                                headers={"Host": host}))
    #             else:
    #                 req = session.prepare_request(requests.Request("GET", f"http://{host}"))
    #             response = session.send(req, allow_redirects=False, timeout=TIMEOUT)
    #             connections.append(HTTPConnectionRequest(uri=uri,  http_response=response))
    #     except requests.exceptions.Timeout as e:
    #         logger.error(f"Timeout error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPConnectionRequest(uri=uri,
    #                                                  error=TIMEOUT_ERROR))
    #     except requests.exceptions.ConnectionError as e:
    #         logger.error(f"Connection error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPConnectionRequest(uri=uri,
    #                                                  error=CONNECTION_ERROR))
    #     except BaseException as e:
    #         logger.error(f"Unknown error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPConnectionRequest(uri=uri,
    #                                                  error=UNKNOWN_ERROR))
    #
    # elif scheme.lower() == "https":
    #     try:
    #         with requests.Session() as session:
    #             if ip_address:
    #                 session.mount("https://",
    #                               host_header_ssl.HostHeaderSSLAdapter())
    #                 req = requests.Request("GET", f"https://{ip_address}", headers={"Host": host})
    #             else:
    #                 req = requests.Request("GET", f"https://{host}")
    #
    #             response = session.send(session.prepare_request(req), allow_redirects=False, timeout=TIMEOUT)
    #             connections.append(HTTPSConnectionRequest(uri=uri,  http_response=response))
    #     except requests.exceptions.Timeout as e:
    #         logger.error(f"Timeout error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPConnectionRequest(uri=uri,
    #                                                  error=TIMEOUT_ERROR))
    #     except requests.exceptions.ConnectionError as e:
    #         logger.error(f"Connection error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPConnectionRequest(uri=uri,
    #                                                  error=CONNECTION_ERROR))
    #
    #     except BaseException as e:
    #         logger.error(f"Unknown error while requesting {uri}: {str(e)}")
    #         connections.append(HTTPSConnectionRequest(uri=uri,
    #                                                   error=UNKNOWN_ERROR))

    # while response and response.next and len(connections) < 10:
    #     cur_uri = response.next.url
    #     next_split_uri = urlsplit(cur_uri)
    #     next_scheme = next_split_uri.scheme
    #
    #     # response.close()
    #     logger.error(response.next.__dict__)
    #     logger.error("\n\n")
    #     logger.error(response.next.url)
    #     logger.error(response.next.headers)
    #     logger.error("\n\n")
    #
    #     try:
    #         response = session.send(response.next, allow_redirects=False, timeout=TIMEOUT)
    #         if next_scheme.lower() == "http":
    #             connections.append(
    #                 HTTPConnectionRequest(uri=cur_uri,
    #                                       http_response=response))
    #         elif next_scheme.lower() == "https":
    #             connections.append(
    #                 HTTPSConnectionRequest(uri=cur_uri, http_response=response))
    #     except requests.exceptions.Timeout as e:
    #         logger.error(f"Timeout error while requesting during redirection {uri}:", e)
    #         if next_scheme.lower() == "http":
    #             connections.append(
    #                 HTTPConnectionRequest(uri=cur_uri, error=TIMEOUT_ERROR))
    #         elif next_scheme.lower() == "https":
    #             connections.append(
    #                 HTTPSConnectionRequest(uri=cur_uri, error=TIMEOUT_ERROR))
    #         break
    #     except requests.exceptions.ConnectionError as e:
    #         logger.error(f"Connection error while requesting during redirection {uri}:", e)
    #         if next_scheme.lower() == "http":
    #             connections.append(
    #                 HTTPConnectionRequest(uri=cur_uri, error=CONNECTION_ERROR))
    #         elif next_scheme.lower() == "https":
    #             connections.append(
    #                 HTTPSConnectionRequest(uri=cur_uri, error=CONNECTION_ERROR))
    #         break
    #     except BaseException as e:
    #         logger.error(f"Unknown error while requesting during redirection {uri}:", e)
    #         if next_scheme.lower() == "http":
    #             connections.append(
    #                 HTTPConnectionRequest(uri=cur_uri, error=UNKNOWN_ERROR))
    #         elif next_scheme.lower() == "https":
    #             connections.append(
    #                 HTTPSConnectionRequest(uri=cur_uri, error=UNKNOWN_ERROR))
    #         break

    return connections


@dataclass
class ChainResult:
    scheme: str
    domain: str
    uri: str = field(init=False)
    has_redirect_loop: bool = field(init=False, default=False)
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = field(
        init=False)

    def __init__(self, ip_address: str, scheme: str, domain: str):
        self.scheme = scheme
        self.domain = domain
        self.uri = f"{self.scheme}://{self.domain}"
        self.connections = get_connection_chain(uri=self.uri, ip_address=ip_address)

        for i in range(len(self.connections) - 1):
            cur_conn = self.connections[i]

            for next_conn in self.connections[i + 1:]:
                if cur_conn.uri == next_conn.uri:
                    self.has_redirection_loop = True
                    break


@dataclass
class EndpointChainScanResult:
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


def scan_chain(domain, ip_address) -> EndpointChainScanResult:
    endpoint_scan_result = EndpointChainScanResult(domain=domain,
                                                   ip_address=ip_address)

    return endpoint_scan_result
