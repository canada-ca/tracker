import sys
import logging
from .models import Domain, Endpoint

logging.basicConfig(stream=sys.stdout, level=logging.WARNING)

suffix_list = None
preload_pending = None
preload_list = None
STORE = "Mozilla"


def result_for(domain):

    # Because it will inform many other judgments, first identify
    # an acceptable "canonical" URL for the domain.
    domain.canonical = canonical_endpoint(domain.http, domain.httpwww, domain.https, domain.httpswww)

    # First, the basic fields the CSV will use.
    result = {
        'Domain': domain.domain,
        'Base Domain': parent_domain_for(domain.domain),
        'Canonical URL': domain.canonical.url,
        'Live': is_live(domain),
        'Redirect': is_redirect_domain(domain),
        'Redirect To': redirects_to(domain),

        'HTTPS Live': is_https_live(domain),
        'HTTPS Full Connection': is_full_connection(domain),
        'HTTPS Client Auth Required': is_client_auth_required(domain),

        'Valid HTTPS': is_valid_https(domain),
        'HTTPS Publicly Trusted': is_publicly_trusted(domain),
        'HTTPS Custom Truststore Trusted': is_custom_trusted(domain),
        'Defaults to HTTPS': is_defaults_to_https(domain),
        'Downgrades HTTPS': is_downgrades_https(domain),
        'Strictly Forces HTTPS': is_strictly_forces_https(domain),

        'HTTPS Bad Chain': is_bad_chain(domain),
        'HTTPS Bad Hostname': is_bad_hostname(domain),
        'HTTPS Expired Cert': is_expired_cert(domain),
        'HTTPS Self Signed Cert': is_self_signed_cert(domain),
        'HTTPS Cert Chain Length': cert_chain_length(domain),
        'HTTPS Probably Missing Intermediate Cert': is_missing_intermediate_cert(domain),

        'HSTS': is_hsts(domain),
        'HSTS Header': hsts_header(domain),
        'HSTS Max Age': hsts_max_age(domain),
        'HSTS Entire Domain': is_hsts_entire_domain(domain),
        'HSTS Preload Ready': is_hsts_preload_ready(domain),
        'HSTS Preload Pending': is_hsts_preload_pending(domain),
        'HSTS Preloaded': is_hsts_preloaded(domain),
        'Base Domain HSTS Preloaded': is_parent_hsts_preloaded(domain),

        'Domain Supports HTTPS': is_domain_supports_https(domain),
        'Domain Enforces HTTPS': is_domain_enforces_https(domain),
        'Domain Uses Strong HSTS': is_domain_strong_hsts(domain),

        'IP': get_domain_ip(domain),
        'Server Header': get_domain_server_header(domain),
        'Server Version': get_domain_server_version(domain),
        'Notes': get_domain_notes(domain),
        'Unknown Error': did_domain_error(domain),
    }

    return result

def canonical_endpoint(http, httpwww, https, httpswww):
    """
    Given behavior for the 4 endpoints, make a best guess
    as to which is the "canonical" site for the domain.
    Most of the domain-level decisions rely on this guess in some way.
    A domain is "canonically" at www if:
     * at least one of its www endpoints responds
     * both root endpoints are either down or redirect *somewhere*
     * either both root endpoints are down, *or* at least one
       root endpoint redirect should immediately go to
       an *internal* www endpoint
    This is meant to affirm situations like:
      http:// -> https:// -> https://www
      https:// -> http:// -> https://www
    and meant to avoid affirming situations like:
      http:// -> http://non-www,
      http://www -> http://non-www
    or like:
      https:// -> 200, http:// -> http://www
    """

    at_least_one_www_used = httpswww.live or httpwww.live

    def root_unused(endpoint):
        return (
            endpoint.redirect or
            (not endpoint.live) or
            endpoint.https_bad_hostname or  # harmless for http endpoints
            (not str(endpoint.status).startswith("2"))
        )

    def root_down(endpoint):
        return (
            (not endpoint.live) or
            endpoint.https_bad_hostname or
            (
                (not str(endpoint.status).startswith("2")) and
                (not str(endpoint.status).startswith("3"))
            )
        )

    all_roots_unused = root_unused(https) and root_unused(http)

    all_roots_down = root_down(https) and root_down(http)

    is_www = (
        at_least_one_www_used and
        all_roots_unused and (
            all_roots_down or
            https.redirect_immediately_to_www or
            http.redirect_immediately_to_www
        )
    )

    # A domain is "canonically" at https if:
    #  * at least one of its https endpoints is live and
    #    doesn't have an invalid hostname
    #  * both http endpoints are either down or redirect *somewhere*
    #  * at least one http endpoint redirects immediately to
    #    an *internal* https endpoint
    # This is meant to affirm situations like:
    #   http:// -> http://www -> https://
    #   https:// -> http:// -> https://www
    # and meant to avoid affirming situations like:
    #   http:// -> http://non-www
    #   http://www -> http://non-www
    # or:
    #   http:// -> 200, http://www -> https://www
    #
    # It allows a site to be canonically HTTPS if the cert has
    # a valid hostname but invalid chain issues.

    def https_used(endpoint):
        return endpoint.live and (not endpoint.https_bad_hostname)

    def http_unused(endpoint):
        return (
            endpoint.redirect or
            (not endpoint.live) or
            (not str(endpoint.status).startswith("2"))
        )

    def http_upgrades(endpoint):
        return (
            endpoint.redirect_immediately_to_https and
            (not endpoint.redirect_immediately_to_external)
        )

    at_least_one_https_endpoint = https_used(https) or https_used(httpswww)
    all_http_unused = http_unused(http) and http_unused(httpwww)
    both_http_down = (not http.live) and (not httpwww.live)
    at_least_one_http_upgrades = http_upgrades(http) or http_upgrades(httpwww)

    is_https = (
        at_least_one_https_endpoint and
        all_http_unused and
        (
            both_http_down or at_least_one_http_upgrades
        )
    )

    if is_www and is_https:
        return httpswww
    elif is_www and (not is_https):
        return httpwww
    elif (not is_www) and is_https:
        return https
    elif (not is_www) and (not is_https):
        return http

def is_live(domain):
    """
    Domain is "live" if *any* endpoint is live.
    """
    http, httpwww, https, httpswww = domain.http, domain.httpwww, domain.https, domain.httpswww

    return http.live or httpwww.live or https.live or httpswww.live


def is_https_live(domain):
    """
    Domain is https live if any https endpoint is live.
    """
    https, httpswww = domain.https, domain.httpswww

    return https.live or httpswww.live


def is_full_connection(domain):
    """
    Domain is "fully connected" if any https endpoint is fully connected.
    """
    https, httpswww = domain.https, domain.httpswww

    return https.https_full_connection or httpswww.https_full_connection


def is_client_auth_required(domain):
    """
    Domain requires client authentication if *any* HTTPS endpoint requires it for full TLS connection.
    """
    https, httpswww = domain.https, domain.httpswww

    return https.https_client_auth_required or httpswww.https_client_auth_required


def is_redirect_or_down(endpoint):
    """
    Endpoint is a redirect or down if it is a redirect to an external site or it is down in any of 3 ways:
    it is not live, it is HTTPS and has a bad hostname in the cert, or it responds with a 4xx error code
    """
    return (
        endpoint.redirect_eventually_to_external or
        (not endpoint.live) or
        (
            endpoint.protocol == "https" and
            endpoint.https_bad_hostname
        ) or
        (
            endpoint.status is not None and
            endpoint.status >= 400
        )
    )


def is_redirect(endpoint):
    """
    Endpoint is a redirect if it is a redirect to an external site
    """
    return endpoint.redirect_eventually_to_external


def is_redirect_domain(domain):
    """
    Domain is "a redirect domain" if at least one endpoint is
    a redirect, and all endpoints are either redirects or down.
    """
    http, httpwww, https, httpswww = domain.http, domain.httpwww, domain.https, domain.httpswww

    return is_live(domain) and (
        (
            is_redirect(http) or is_redirect(httpwww) or is_redirect(https) or is_redirect(httpswww)
        ) and
        is_redirect_or_down(https) and
        is_redirect_or_down(httpswww) and
        is_redirect_or_down(httpwww) and
        is_redirect_or_down(http)
    )


def is_http_redirect_domain(domain):
    """
    Domain is "an http redirect domain" if at least one http endpoint
    is a redirect, and all other http endpoints are either redirects
    or down.
    """
    http, httpwww, = domain.http, domain.httpwww

    return is_live(domain) and (
        (
            is_redirect(http) or is_redirect(httpwww)
        ) and
        is_redirect_or_down(httpwww) and
        is_redirect_or_down(http)
    )


def redirects_to(domain):
    """
    If a domain is a "redirect domain", where does it redirect to?
    """
    canonical = domain.canonical

    if is_redirect_domain(domain):
        return canonical.redirect_eventually_to
    else:
        return None


def is_valid_https(domain):
    """
    A domain has "valid HTTPS" if it responds on port 443 at its canonical
    hostname with an unexpired valid certificate for the hostname.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    # Evaluate the HTTPS version of the canonical hostname
    if canonical.host == "root":
        evaluate = https
    else:
        evaluate = httpswww

    return evaluate.live and evaluate.https_valid


def is_defaults_to_https(domain):
    """
    A domain "defaults to HTTPS" if its canonical endpoint uses HTTPS.
    """
    canonical = domain.canonical

    return (canonical.protocol == "https")


def is_downgrades_https(domain):
    """
    Domain downgrades if HTTPS is supported in some way, but
    its canonical HTTPS endpoint immediately redirects internally to HTTP.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    # The domain "supports" HTTPS if any HTTPS endpoint responds with
    # a certificate valid for its hostname.
    supports_https = (
        https.live and (not https.https_bad_hostname)
    ) or (
        httpswww.live and (not httpswww.https_bad_hostname)
    )

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    # Explicitly convert to bool to avoid unintentionally returning None,
    # which may happen if the site doesn't redirect.
    return bool(
        supports_https and
        canonical_https.redirect_immediately_to_http and
        (not canonical_https.redirect_immediately_to_external)
    )


def is_strictly_forces_https(domain):
    """
    A domain "Strictly Forces HTTPS" if one of the HTTPS endpoints is
    "live", and if both *HTTP* endpoints are either:
     * down, or
     * redirect immediately to an HTTPS URI.
    This is different than whether a domain "Defaults" to HTTPS.
    * An HTTP redirect can go to HTTPS on another domain, as long
      as it's immediate.
    * A domain with an invalid cert can still be enforcing HTTPS.
    """
    http, httpwww, https, httpswww = domain.http, domain.httpwww, domain.https, domain.httpswww

    def down_or_redirects(endpoint):
        return ((not endpoint.live) or endpoint.redirect_immediately_to_https)

    https_somewhere = https.live or httpswww.live
    all_http_unused = down_or_redirects(http) and down_or_redirects(httpwww)

    return https_somewhere and all_http_unused


def is_publicly_trusted(domain):
    """
    A domain has a "Publicly Trusted" certificate if its canonical
    endpoint has a publicly trusted certificate.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    # Evaluate the HTTPS version of the canonical hostname
    if canonical.host == "root":
        evaluate = https
    else:
        evaluate = httpswww

    return evaluate.live and evaluate.https_public_trusted


def is_custom_trusted(domain):
    """
    A domain has a "Custom Trusted" certificate if its canonical
    endpoint has a certificate that is trusted by the custom
    truststore.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    # Evaluate the HTTPS version of the canonical hostname
    if canonical.host == "root":
        evaluate = https
    else:
        evaluate = httpswww

    return evaluate.live and evaluate.https_custom_trusted


def is_bad_chain(domain):
    """
    Domain has a bad chain if its canonical https endpoint has a bad
    chain
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_bad_chain


def is_bad_hostname(domain):
    """
    Domain has a bad hostname if its canonical https endpoint fails
    hostname validation
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_bad_hostname


def is_expired_cert(domain):
    """
    Returns if its canonical https endpoint has an expired cert
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_expired_cert


def is_self_signed_cert(domain):
    """
    Returns if its canonical https endpoint has a self-signed cert cert
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_self_signed_cert


def cert_chain_length(domain):
    """
    Returns the cert chain length for the canonical HTTPS endpoint
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_cert_chain_len


def is_missing_intermediate_cert(domain):
    """
    Returns whether the served cert chain is probably missing the
    needed intermediate certificate for the canonical HTTPS endpoint
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.https_missing_intermediate_cert


def is_hsts(domain):
    """
    Domain has HSTS if its canonical HTTPS endpoint has HSTS.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.hsts


def hsts_header(domain):
    """
    Domain's HSTS header is its canonical endpoint's header.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.hsts_header


def hsts_max_age(domain):
    """
    Domain's HSTS max-age is its canonical endpoint's max-age.
    """
    canonical, https, httpswww = domain.canonical, domain.https, domain.httpswww

    if canonical.host == "www":
        canonical_https = httpswww
    else:
        canonical_https = https

    return canonical_https.hsts_max_age


def is_hsts_entire_domain(domain):
    """
    Whether a domain's ROOT endpoint includes all subdomains.
    """
    https = domain.https

    return https.hsts_all_subdomains


def is_hsts_preload_ready(domain):
    """
    Whether a domain's ROOT endpoint is preload-ready.
    """
    https = domain.https

    eighteen_weeks = ((https.hsts_max_age is not None) and (https.hsts_max_age >= 10886400))
    preload_ready = (eighteen_weeks and https.hsts_all_subdomains and https.hsts_preload)

    return preload_ready


def is_hsts_preload_pending(domain):
    """
    Whether a domain is formally pending inclusion in Chrome's HSTS preload
    list.
    If preload_pending is None, the caches have not been initialized, so do
    that.
    """
    if preload_pending is None:
        logging.error('`preload_pending` has not yet been initialized!')
        raise RuntimeError(
            '`initialize_external_data()` must be called explicitly before '
            'using this function'
        )

    return domain.domain in preload_pending


def is_hsts_preloaded(domain):
    """
    Whether a domain is contained in Chrome's HSTS preload list.
    If preload_list is None, the caches have not been initialized, so do that.
    """
    if preload_list is None:
        logging.error('`preload_list` has not yet been initialized!')
        raise RuntimeError(
            '`initialize_external_data()` must be called explicitly before '
            'using this function'
        )

    return domain.domain in preload_list


def is_parent_hsts_preloaded(domain):
    """
    Whether a domain's parent domain is in Chrome's HSTS preload list.
    """
    return is_hsts_preloaded(Domain(parent_domain_for(domain.domain)))


def parent_domain_for(hostname):
    """
    For "x.y.domain.gov", return "domain.gov".
    If suffix_list is None, the caches have not been initialized, so do that.
    """
    if suffix_list is None:
        logging.error('`suffix_list` has not yet been initialized!')
        raise RuntimeError(
            '`initialize_external_data()` must be called explicitly before '
            'using this function'
        )

    return suffix_list.get_public_suffix(hostname)


def is_domain_supports_https(domain):
    """
    A domain 'Supports HTTPS' when it doesn't downgrade and has valid HTTPS,
    or when it doesn't downgrade and has a bad chain but not a bad hostname.
    Domains with a bad chain "support" HTTPS but user-side errors should be expected.
    """
    return (
        (not is_downgrades_https(domain)) and
        is_valid_https(domain)
    ) or (
        (not is_downgrades_https(domain)) and
        is_bad_chain(domain) and
        (not is_bad_hostname(domain))
    )


def is_domain_enforces_https(domain):
    """A domain that 'Enforces HTTPS' must 'Support HTTPS' and default to
    HTTPS.  For websites (where Redirect is false) they are allowed to
    eventually redirect to an https:// URI. For "redirect domains"
    (domains where the Redirect value is true) they must immediately
    redirect clients to an https:// URI (even if that URI is on
    another domain) in order to be said to enforce HTTPS.
    """
    return is_domain_supports_https(domain) and is_strictly_forces_https(domain) and (
        is_defaults_to_https(domain) or is_http_redirect_domain(domain)
    )


def is_domain_strong_hsts(domain):
    if is_hsts(domain) and hsts_max_age(domain):
        return (
            is_hsts(domain) and
            hsts_max_age(domain) >= 31536000
        )
    else:
        return None


def get_domain_ip(domain):
    """
    Get the IP for the domain.  Any IP that responded is good enough.
    """
    if domain.canonical.ip is not None:
        return domain.canonical.ip
    if domain.https.ip is not None:
        return domain.https.ip
    if domain.httpswww.ip is not None:
        return domain.httpswww.ip
    if domain.httpwww.ip is not None:
        return domain.httpwww.ip
    if domain.http.ip is not None:
        return domain.http.ip
    return None


def get_domain_server_header(domain):
    """
    Get the Server header from the response for the domain.
    """
    if domain.canonical.server_header is not None:
        return domain.canonical.server_header.replace(',', ';')
    if domain.https.server_header is not None:
        return domain.https.server_header.replace(',', ';')
    if domain.httpswww.server_header is not None:
        return domain.httpswww.server_header.replace(',', ';')
    if domain.httpwww.server_header is not None:
        return domain.httpwww.server_header.replace(',', ';')
    if domain.http.server_header is not None:
        return domain.http.server_header.replace(',', ';')
    return None


def get_domain_server_version(domain):
    """
    Get the Server version based on the Server header for the web server.
    """
    if domain.canonical.server_version is not None:
        return domain.canonical.server_version
    if domain.https.server_version is not None:
        return domain.https.server_version
    if domain.httpswww.server_version is not None:
        return domain.httpswww.server_version
    if domain.httpwww.server_version is not None:
        return domain.httpwww.server_version
    if domain.http.server_version is not None:
        return domain.http.server_version
    return None


def get_domain_notes(domain):
    """
    Combine all domain notes if there are any.
    """
    all_notes = domain.http.notes + domain.httpwww.notes + domain.https.notes + domain.httpswww.notes
    all_notes = all_notes.replace(',', ';')
    return all_notes


def did_domain_error(domain):
    """
    Checks if the domain had an Unknown error somewhere
    The main purpos of this is to flag any odd websites for
    further debugging with other tools.
    """
    http, httpwww, https, httpswww = domain.http, domain.httpwww, domain.https, domain.httpswww

    return (
        http.unknown_error or httpwww.unknown_error or
        https.unknown_error or httpswww.unknown_error
    )

