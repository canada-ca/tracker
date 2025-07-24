import re
from typing import Optional, Union
from urllib.parse import urlsplit
import urllib3

import logging
import requests
from requests import Response, PreparedRequest
from dataclasses import dataclass, field

from scan.endpoint_chain_scanner.constants import DEFAULT_REQUEST_HEADERS, TIMEOUT
from scan.endpoint_chain_scanner.security_txt_check import fetch_security_txt
from scan.endpoint_chain_scanner.session_extensions import SessionOverrideRedirectWithIP, HostHeaderSSLAdapter


logger = logging.getLogger(__name__)

CONNECTION_ERROR = "CONNECTION_ERROR"
CONNECTION_TIMEOUT_ERROR = "CONNECTION_TIMEOUT_ERROR"
READ_TIMEOUT_ERROR = "READ_TIMEOUT_ERROR"
TIMEOUT_ERROR = "TIMEOUT_ERROR"
UNKNOWN_ERROR = "UNKNOWN_ERROR"

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


@dataclass
class HTTPConnection:
    url: str
    status_code: int
    redirect_to: str
    headers: dict
    blocked_category: str = None

    def __init__(self, http_response: Response):
        self.url = http_response.url
        self.redirect_to = http_response.headers.get("location", None)
        self.status_code = http_response.status_code
        self.headers = dict(http_response.headers)
        if http_response.status_code == 403:
            content = http_response.text
            category_search = re.search(
                r"ATTENTION: Access Denied[\s\S]+Category: (.*)[\s\S]+Access to this Web page is blocked in accordance with the Treasury Board of Canada Secretariat",
                content,
            )
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

    def __init__(
        self,
        uri: str,
        http_response: Optional[Response] = None,
        error: Optional[str] = None,
    ):
        self.uri = uri
        self.error = str(error) if error else error
        if error:
            return
        if self.scheme == "http":
            self.connection = HTTPConnection(http_response=http_response)
        elif self.scheme == "https":
            self.connection = HTTPSConnection(http_response=http_response)


@dataclass(init=False)
class HTTPSConnectionRequest(HTTPConnectionRequest):
    scheme: str = "https"


def request_connection(
    uri: Optional[str] = None,
    session: requests.Session = None,
    prepared_request: Optional[PreparedRequest] = None,
):
    uri = uri or prepared_request.url
    split_uri = urlsplit(uri)
    scheme = split_uri.scheme
    host = split_uri.hostname
    response = None
    context = (
        f"while requesting {uri}"
        if not prepared_request
        else f"while requesting {uri} during redirect"
    )

    try:
        if prepared_request:
            req = prepared_request
        else:
            req = session.prepare_request(
                requests.Request(
                    "GET",
                    uri,
                    headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
                )
            )

        response = session.send(req, allow_redirects=False, timeout=TIMEOUT)

        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, http_response=response)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, http_response=response)
        return {"connection": connection, "response": response}

    except requests.exceptions.ConnectTimeout as e:
        logger.info(f"Connection timeout error {context}: {repr(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=CONNECTION_TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=CONNECTION_TIMEOUT_ERROR)
        return {"connection": connection, "response": response}
    except requests.exceptions.ReadTimeout as e:
        logger.info(f"Read timeout error {context}: {repr(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=READ_TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=READ_TIMEOUT_ERROR)
        return {"connection": connection, "response": response}
    except requests.exceptions.Timeout as e:
        logger.info(f"Timeout error {context}: {repr(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
        return {"connection": connection, "response": response}

    except requests.exceptions.ConnectionError as e:
        logger.info(f"Connection error {context}: {repr(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=CONNECTION_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=CONNECTION_ERROR)
        return {"connection": connection, "response": response}

    except BaseException as e:
        logger.error(f"Unknown error {context}: {repr(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=UNKNOWN_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=UNKNOWN_ERROR)
        return {"connection": connection, "response": response}


def get_connection_chain(uri, ip_override_map):
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = []

    with SessionOverrideRedirectWithIP(ip_override_map=ip_override_map) as session:
        session.verify = False
        session.mount(
            "https://",
            HostHeaderSSLAdapter(),
        )

        hostname = urlsplit(uri).hostname

        send_uri = uri
        if hostname in ip_override_map:
            ip_address = ip_override_map[hostname]
            send_uri = uri.replace(hostname, ip_address, 1)

        req = session.prepare_request(
            requests.Request(
                "GET",
                send_uri,
                headers={"Host": hostname, **DEFAULT_REQUEST_HEADERS},
            )
        )

        connection_request = request_connection(
            uri=uri, prepared_request=req, session=session
        )
        connection = connection_request.get("connection")
        connections.append(connection)
        response = connection_request.get("response")

        while response and response.next and len(connections) < 10:
            req = response.next
            if req._url_with_hostname:
                url = req._url_with_hostname
            else:
                url = req.url

            connection_request = request_connection(
                uri=url, prepared_request=req, session=session
            )
            connection = connection_request.get("connection")
            connections.append(connection)
            response = connection_request.get("response")

    return connections


@dataclass
class ChainResult:
    scheme: str
    domain: str
    uri: str = field(init=False)
    has_redirect_loop: bool = field(init=False, default=False)
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = field(
        init=False
    )
    security_txt: Optional[list] = field(init=False, default=None)

    def __init__(self, ip_address: str, scheme: str, domain: str):
        self.scheme = scheme
        self.domain = domain
        self.uri = f"{self.scheme}://{self.domain}"
        ip_override_map = {domain: ip_address}
        self.connections = get_connection_chain(
            uri=self.uri, ip_override_map=ip_override_map
        )
        # Only check security.txt for HTTPS endpoints, per RFC 9116
        if self.scheme == "https":
            self.security_txt = fetch_security_txt(domain, ip_address)
        else:
            self.security_txt = None
        for i in range(len(self.connections) - 1):
            cur_conn = self.connections[i]

            for next_conn in self.connections[i + 1 :]:
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
        self.http_chain_result = ChainResult(
            scheme="http", domain=self.domain, ip_address=self.ip_address
        )
        self.https_chain_result = ChainResult(
            scheme="https", domain=self.domain, ip_address=self.ip_address
        )


def scan_chain(domain, ip_address) -> EndpointChainScanResult:
    endpoint_scan_result = EndpointChainScanResult(domain=domain, ip_address=ip_address)

    return endpoint_scan_result
