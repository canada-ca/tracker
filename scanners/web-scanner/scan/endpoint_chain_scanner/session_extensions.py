import logging
import ssl
from urllib.parse import urlparse, urljoin

import requests
from requests.adapters import HTTPAdapter


logger = logging.getLogger(__name__)

class SessionOverrideRedirectWithIP(requests.Session):
    def __init__(self, ip_override_map):
        self.ip_override_map = ip_override_map or {}
        super().__init__()

    def get_redirect_target(self, resp):
        original_redirect_target = super().get_redirect_target(resp=resp)
        parsed = urlparse(original_redirect_target)

        if not original_redirect_target:
            resp._is_relative_redirect = False
            resp._is_schema_relative_redirect = False
        elif original_redirect_target.startswith('//'):
            resp._is_relative_redirect = False
            resp._is_schema_relative_redirect = True
        elif not parsed.netloc:
            resp._is_relative_redirect = True
            resp._is_schema_relative_redirect = False
        else:
            resp._is_relative_redirect = False
            resp._is_schema_relative_redirect = False

        resp._original_redirect_target = original_redirect_target

        redirect_target = original_redirect_target
        redirect_with_hostname = redirect_target

        if not redirect_target:
            pass
        elif resp._is_relative_redirect:
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
        elif resp._is_schema_relative_redirect:
            # Schema-relative redirect: //example.com/path
            current_scheme = urlparse(resp.url).scheme
            redirect_target = f"{current_scheme}:{original_redirect_target}"

            redirect_parsed = urlparse(redirect_target)

            # Handle IP override mapping
            if redirect_parsed.hostname in self.ip_override_map:
                redirect_target = redirect_target.replace(
                    redirect_parsed.hostname,
                    self.ip_override_map[redirect_parsed.hostname],
                    1
                )

            # Ensure the original host is saved for the redirect for metadata
            redirect_with_hostname = f"{current_scheme}:{original_redirect_target}"
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
