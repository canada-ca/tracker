import re
import ssl
from typing import Optional, Union
from urllib.parse import urlsplit, urljoin, urlparse
import urllib3

import logging
import requests
from requests.adapters import HTTPAdapter
from requests import Response, PreparedRequest
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Set the default timeout for requests (connect, read)
TIMEOUT = (2.0, 10)

CONNECTION_ERROR = "CONNECTION_ERROR"
CONNECTION_TIMEOUT_ERROR = "CONNECTION_TIMEOUT_ERROR"
READ_TIMEOUT_ERROR = "READ_TIMEOUT_ERROR"
TIMEOUT_ERROR = "TIMEOUT_ERROR"
UNKNOWN_ERROR = "UNKNOWN_ERROR"

DEFAULT_REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0 Tracker-Suivi (+https://github.com/canada-ca/tracker)",
}

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


class SessionOverrideRedirectWithIP(requests.Session):
    def __init__(self, ip_override_map):
        self.ip_override_map = ip_override_map or {}
        super().__init__()

    def get_redirect_target(self, resp):
        original_redirect_target = super().get_redirect_target(resp=resp)
        parsed = urlparse(original_redirect_target)

        if original_redirect_target and not parsed.netloc:
            resp._is_relative_redirect = True
        else:
            resp._is_relative_redirect = False
        resp._original_redirect_target = original_redirect_target

        redirect_target = original_redirect_target
        redirect_with_hostname = redirect_target

        if not redirect_target:
            pass
        elif not parsed.netloc:
            # Redirect is relative. Build out the full URL.
            redirect_target = urljoin(resp.url, original_redirect_target)
            host = resp.request.headers.get("Host")
            # Ensure the original host is saved for the redirect for metadata
            if (
                host in self.ip_override_map
                and host != urlparse(redirect_target).hostname
            ):
                redirect_with_hostname = redirect_target.replace(
                    self.ip_override_map[host], host, 1
                )
            else:
                redirect_with_hostname = redirect_target
        elif parsed.hostname in self.ip_override_map:
            # If hostname is in override map, replace with IP address to send directly to specified IP address
            redirect_target = original_redirect_target.replace(
                parsed.hostname, self.ip_override_map[parsed.hostname], 1
            )

        resp._redirect_with_hostname = redirect_with_hostname
        return redirect_target

    def resolve_redirects(
        self,
        resp,
        req,
        stream=False,
        timeout=None,
        verify=True,
        cert=None,
        proxies=None,
        yield_requests=False,
        **adapter_kwargs,
    ):
        # Call the parent method to get the generator
        redirect_generator = super().resolve_redirects(
            resp,
            req,
            stream,
            timeout,
            verify,
            cert,
            proxies,
            yield_requests,
            **adapter_kwargs,
        )

        for prepared_request in redirect_generator:
            if not hasattr(resp, "_redirect_with_hostname"):
                # This shouldn't happen. Log it.
                logger.error(
                    f"Redirect target {resp._original_redirect_target} does not have a '_redirect_with_hostname' attribute. This should not happen."
                )
            else:
                prepared_request._url_with_hostname = resp._redirect_with_hostname
                prepared_request.headers["Host"] = urlparse(
                    resp._redirect_with_hostname
                ).hostname

            yield prepared_request


class AnyTlsVersionAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **pool_kwargs):
        ssl_context = ssl.create_default_context()
        ssl_context.set_ciphers("DEFAULT@SECLEVEL=0")
        ssl_context.check_hostname = False
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1
        pool_kwargs["ssl_context"] = ssl_context

        return super().init_poolmanager(*args, **pool_kwargs)


class HostHeaderSSLAdapter(AnyTlsVersionAdapter):
    # Copied from https://github.com/requests/toolbelt/blob/9f6209553bbf8f31caccaf8efe15c89ec74dd147/requests_toolbelt/adapters/host_header_ssl.py

    def send(self, request, **kwargs):
        # HTTP headers are case-insensitive (RFC 7230)
        host_header = None
        for header in request.headers:
            if header.lower() == "host":
                host_header = request.headers[header]
                break

        connection_pool_kwargs = self.poolmanager.connection_pool_kw

        if host_header:
            connection_pool_kwargs["assert_hostname"] = host_header
            connection_pool_kwargs["server_hostname"] = host_header
        elif "assert_hostname" in connection_pool_kwargs:
            # an assert_hostname from a previous request may have been left
            connection_pool_kwargs.pop("assert_hostname", None)
            connection_pool_kwargs.pop("server_hostname", None)

        return super().send(request, **kwargs)


def request_connection(
    uri: Optional[str] = None,
    host: Optional[str] = None,
    session: [requests.Session] = None,
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
        logger.info(f"Connection timeout error {context}: {str(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=CONNECTION_TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=CONNECTION_TIMEOUT_ERROR)
        return {"connection": connection, "response": response}
    except requests.exceptions.ReadTimeout as e:
        logger.info(f"Read timeout error {context}: {str(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=READ_TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=READ_TIMEOUT_ERROR)
        return {"connection": connection, "response": response}
    except requests.exceptions.Timeout as e:
        logger.info(f"Timeout error {context}: {str(e)}")
        if scheme.lower() == "http":
            connection = HTTPConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
        elif scheme.lower() == "https":
            connection = HTTPSConnectionRequest(uri=uri, error=TIMEOUT_ERROR)
        return {"connection": connection, "response": response}

    except requests.exceptions.ConnectionError as e:
        logger.info(f"Connection error {context}: {str(e)}")
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

    def __init__(self, ip_address: str, scheme: str, domain: str):
        self.scheme = scheme
        self.domain = domain
        self.uri = f"{self.scheme}://{self.domain}"
        ip_override_map = {domain: ip_address}
        self.connections = get_connection_chain(
            uri=self.uri, ip_override_map=ip_override_map
        )

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
