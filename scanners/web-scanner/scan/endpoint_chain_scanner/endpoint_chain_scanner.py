import re
import ssl
from typing import Optional, Union
from urllib.parse import urlsplit, urljoin, urlparse
import urllib3

import logging
import requests

# from requests._internal_utils import to_native_string
from requests.adapters import HTTPAdapter
from requests import Response, PreparedRequest
from dataclasses import dataclass, field

from requests.utils import requote_uri

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
                "ATTENTION: Access Denied[\s\S]+Category: (.*)[\s\S]+Access to this Web page is blocked in accordance with the Treasury Board of Canada Secretariat",
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


# class CustomNextResponseAdapter(HTTPAdapter):
#     def __init__(self, *args, **kwargs):
#         self.ip_map = kwargs.pop("ip_map", None)
#         if self.ip_map is None:
#             self.ip_map = {}
#             logger.debug("ip_map is None, using empty dict")
#         # self.session = kwargs.pop("session", None)
#         # if self.session is None:
#         #     logger.error("Session is required for OverrideIpAdapter")
#         #     raise ValueError("Session is required for OverrideIpAdapter")
#         super().__init__(*args, **kwargs)
#
#     def send(self, request, *args, **kwargs):
#
#         k = kwargs
#
#         # Call the parent class's send method to get the response
#         response = super(CustomNextResponseAdapter, self).send(request, *args, **kwargs)
#         # If the response is a redirect, check if the hostname is an IP address (and is in the ip_map)
#         print("here")
#         # if response.is_redirect and response.next:
#         #     # Check if the next URL hostname is an IP address
#         #     next_url = response.next.url
#         #     next_hostname = urlsplit(next_url).hostname
#         #     if next_hostname and next_hostname in self.ip_map.values():
#         #         # If it is, get the original hostname from the request
#         #         original_hostname = request.headers.get("Host")
#         #         if original_hostname:
#         #             # Replace the IP address in the next URL with the original hostname
#         #             new_url = next_url.replace(next_hostname, original_hostname)
#
#         return response


class SessionOverrideRedirectWithIP(requests.Session):
    def __init__(self, ip_override_map):
        self.ip_override_map = ip_override_map or {}
        super().__init__()

    def get_redirect_target(self, resp):
        original_redirect_target = super().get_redirect_target(resp=resp)
        parsed = urlparse(original_redirect_target)

        if not original_redirect_target or not parsed.hostname:
            return original_redirect_target

        if parsed.hostname in self.ip_override_map:
            # If hostname is in override map, replace with IP address to send directly to specified IP address
            new_redirect = original_redirect_target.replace(
                parsed.hostname, self.ip_override_map[parsed.hostname]
            )
            resp._original_redirect_target = original_redirect_target
            return new_redirect

        return original_redirect_target


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


# def fix_relative_redirects(response, hostname, ip_override_map, session):
#     # Relative redirects for requests to specific IP addresses do not work correctly
#     # as the IP address will be the host in the Location header instead of the hostname
#     # This function will mutate the response in place to fix the Location header
#     location = response.headers.get("location")
#     if location and not location.startswith(("http://", "https://")):
#         parsed_url = urlparse(response.url)
#         fixed_base = f"{parsed_url.scheme}://{hostname}"
#         fixed_url = urljoin(fixed_base, location)
#         # Mutate in-place
#         response.headers["location"] = fixed_url
#     return response


def request_connection(
    uri: Optional[str] = None,
    host: Optional[str] = None,
    session: [requests.Session] = None,
    prepared_request: Optional[PreparedRequest] = None,
):
    uri = uri or prepared_request.url
    split_uri = urlsplit(uri)
    scheme = split_uri.scheme
    host = host or split_uri.hostname
    response = None
    context = (
        f"while requesting {uri}"
        if not prepared_request
        else f"while requesting {uri} during redirect"
    )

    try:

        # if scheme.lower() == "https" and ip_address:
        #     session.mount(
        #         "https://",
        #         HostHeaderSSLAdapter(ip_map=ip_override_map, session=session),
        #     )
        # else:
        #     session.mount(
        #         "https://",
        #         AnyTlsVersionAdapter(ip_map=ip_override_map, session=session),
        #     )

        if prepared_request:
            req = prepared_request
        else:
            # if host in ip_override_map:
            #     ip_address = ip_override_map[host]
            #     uri = uri.replace(host, ip_address)
            # if ip_address:
            #     send_uri =
            req = session.prepare_request(
                requests.Request(
                    "GET",
                    uri,
                    headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
                )
            )

            # req = session.prepare_request(
            #     requests.Request(
            #         "GET",
            #         f"{scheme.lower()}://{ip_address}",
            #         headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
            #     )
            # )

            # if ip_address:
            #     req = session.prepare_request(
            #         requests.Request(
            #             "GET",
            #             f"{scheme.lower()}://{ip_address}",
            #             headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
            #         )
            #     )
            # else:
            #     req = session.prepare_request(
            #         requests.Request(
            #             "GET",
            #             f"{scheme.lower()}://{host}",
            #             headers={**DEFAULT_REQUEST_HEADERS},
            #         )
            #     )

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


# class SessionWithRedirectHandler(requests.Session):
#     def get_redirect_target(self, resp):
#         # Get redirect target using the session's redirect method, but handle relative and schemaless redirects
#         url = super().get_redirect_target(resp)
#         if not url:
#             return None
#
#         # Handle schemaless and relative redirects
#         # Based on logic from requests.sessions (https://github.com/psf/requests)
#         if url.startswith("//"):
#             parsed_rurl = urlparse(resp.url)
#             url = ":".join([to_native_string(parsed_rurl.scheme), url])
#
#         parsed = urlparse(url)
#         if not parsed.netloc:
#             # netloc not set - relative redirect
#             host = resp.request.headers.get("Host", None)
#             scheme = urlparse(resp.url).scheme
#             host_with_scheme = f"{scheme}://{host}"
#             if not host:
#                 logger.error(f"No host header in response: {resp}")
#             url = urljoin(host_with_scheme or resp.url, requote_uri(url))
#         else:
#             url = requote_uri(url)
#
#         return url


def get_connection_chain(uri, ip_override_map):
    connections: list[Union[HTTPConnectionRequest, HTTPSConnectionRequest]] = []

    # with SessionWithRedirectHandler() as session:
    # with requests.Session() as session:
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
            redirect_target = session.get_redirect_target(response)
            parsed_redirect = urlparse(redirect_target)
            uri = response.next.url
            if parsed_redirect.netloc:
                # Redirect is not relative
                # Delete 'Host' header as it is retained from original request and redirect is not relative
                response.next.headers.pop("Host", None)

            if response.next.headers.get("Host"):
                # Only relative redirects should still have Host header here, use this.
                next_host = response.next.headers.get("Host")
            elif response._original_redirect_target:
                # This should only be set if we override the host with the IP address. Can use the host from here.
                next_host = urlparse(response._original_redirect_target).hostname
            else:
                next_host = urlparse(response.next.url).hostname

            # If IP is set for the host in uri, replace it with expected host (for Host header and metadata)
            if next_host in ip_override_map:
                # Host exists in IP override map.
                if (
                    ip_override_map.get(next_host)
                    == urlparse(response.next.url).hostname
                ):
                    # If IP already in the uri, we should save a copy of the uri using
                    #   the actual host instead of IP to use in the Host header and metadata
                    ip_address_to_swap = ip_override_map[next_host]
                    uri = response.next.url.replace(ip_address_to_swap, next_host, 1)
                # elif next_host == urlparse(response.next.url).hostname:
                #     # Host exists in IP override map, but sending url doesn't use the specified IP in the request.
                #     # To create a new PreparedRequest, mutate the Response url in place and regenerate redirects.
                #     ip_address_to_swap = ip_override_map[next_host]
                #     response.uri = response.next.url.replace(
                #         hostname, ip_address_to_swap
                #     )
                #     req = next(
                #         session.resolve_redirects(
                #             resp=response, req=response.request, yield_requests=True
                #         )
                #     )
                #     pass

            # If hostname is in the IP override map, replace sending destination host with IP.
            # This requires mutating the response in place and recreating the next redirect PreparedRequest

            # if response

            # data_uri = urljoin(response.url, redirect_target)
            # r = parsed_redirect
            # parsed_response_url = urlparse(response.url)
            # parsed_request_url = urlparse(response.request.url)
            # r = r._replace(
            #     scheme=parsed_response_url.scheme, netloc=parsed_request_url.netloc
            # )
            # data_uri = r.geturl()
            # response.uri =
            # host_from_header = response.next.headers.pop("Host", None)
            # host_from_uri = urlsplit(response.next.url).hostname
            # fix relative redirects if required
            # location = session.get_redirect_target(response)

            # next_uri = response.next.url

            #

            # if response.is_redirect:
            #     resolved_redirects = next(
            #         session.resolve_redirects(
            #             resp=response, req=req, yield_requests=True
            #         )
            #     )

            # if ip address is the hostname section of the uri, replace it with the original hostname
            # if host_from_header and host_from_header != host_from_uri:
            #     uri_parsed = urlparse(next_uri)
            #
            #     port = uri_parsed.netloc.split(":")[1]
            #     next_uri = uri_parsed._replace(netloc="")

            # response = fix_relative_redirects(response, host)

            connection_request = request_connection(
                uri=uri, prepared_request=req, session=session
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
