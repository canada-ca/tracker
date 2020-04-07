import sslyze
import re
import datetime
import requests
import logging
import sys
import OpenSSL
import json
import base64
import urllib
import publicsuffix2 as publicsuffix
from sslyze.server_connectivity import ServerConnectivityTester
from sslyze.errors import ConnectionToServerFailed
from sslyze.scanner import Scanner, ServerScanRequest, ScanCommandExtraArgumentsDict
from sslyze.plugins.scan_commands import ScanCommand
from sslyze.server_setting import ServerNetworkLocation, ServerNetworkLocationViaDirectConnection
from sslyze.plugins.certificate_info._certificate_utils import extract_dns_subject_alternative_names
from .models import Domain, Endpoint
from .utils import *

logging.basicConfig(stream=sys.stdout, level=logging.WARNING)


def run(domains):
    results = {}

    initialize_external_data()

    for base_domain in domains:

        domain = Domain(base_domain)
        domain.http = Endpoint("http", "root", base_domain)
        domain.httpwww = Endpoint("http", "www", base_domain)
        domain.https = Endpoint("https", "root", base_domain)
        domain.httpswww = Endpoint("https", "www", base_domain)

        # Analyze HTTP endpoint responsiveness and behavior.
        basic_check(domain.http)
        basic_check(domain.httpwww)
        basic_check(domain.https)
        basic_check(domain.httpswww)

        # Analyze HSTS header, if present, on each HTTPS endpoint.
        hsts_check(domain.https)
        hsts_check(domain.httpswww)

        results[base_domain] = result_for(domain)

        return results


def ping(url, allow_redirects=False, verify=True):

    return requests.get(url, allow_redirects=allow_redirects, verify=verify, stream=True)


def basic_check(endpoint):
    """
    Test the endpoint. At first:
    * Don't follow redirects. (Will only follow if necessary.)
      If it's a 3XX, we'll ping again to follow redirects. This is
      necessary to reliably scope any errors (e.g. TLS errors) to
      the original endpoint.
    * Validate certificates. (Will figure out error if necessary.)
    """

    req = None

    try:
        with ping(endpoint.url) as req:
            endpoint.live = True
            if endpoint.protocol == "https":
                endpoint.https_full_connection = True
                endpoint.https_valid = True

    except requests.exceptions.SSLError as err:
        if (
                "bad handshake" in str(err) and (
                    "sslv3 alert handshake failure" in str(err) or (
                        "Unexpected EOF" in str(err)
                    )
                )
        ):
            logging.exception("{}: Error completing TLS handshake usually due to required client authentication.".format(endpoint.url))
            endpoint.live = True
            if endpoint.protocol == "https":
                # The https can still be valid with a handshake error,
                # sslyze will run later and check if it is not valid
                endpoint.https_valid = True
                endpoint.https_full_connection = False

        else:
            logging.exception("{}: Error connecting over SSL/TLS or validating certificate.".format(endpoint.url))
            # Retry with certificate validation disabled.
            try:
                with ping(endpoint.url, verify=False) as req:
                    endpoint.live = True
                    if endpoint.protocol == "https":
                        endpoint.https_full_connection = True
                        # sslyze later will actually check if the cert is valid
                        endpoint.https_valid = True
            except requests.exceptions.SSLError as err:
                # If it's a protocol error or other, it's not a full connection,
                # but it is live.
                endpoint.live = True
                if endpoint.protocol == "https":
                    endpoint.https_full_connection = False
                    # HTTPS may still be valid, sslyze will double-check later
                    endpoint.https_valid = True
                logging.exception("{}: Unexpected SSL protocol (or other) error during retry.".format(endpoint.url))
                # continue on to SSLyze to check the connection
            except requests.exceptions.RequestException as err:
                endpoint.live = False
                logging.exception("{}: Unexpected requests exception during retry.".format(endpoint.url))
                return
            except OpenSSL.SSL.Error as err:
                endpoint.live = False
                logging.exception("{}: Unexpected OpenSSL exception during retry.".format(endpoint.url))
                return
            except Exception as err:
                endpoint.unknown_error = True
                logging.exception("{}: Unexpected other unknown exception during requests retry.".format(endpoint.url))
                return

        # If it was a certificate error of any kind, it's live,
        # unless SSLyze encounters a connection error later
        endpoint.live = True

    except requests.exceptions.ConnectionError as err:
        # We can get this for some endpoints that are actually live,
        # so if it's https let's try sslyze to be sure
        if(endpoint.protocol == "https"):
            # https check later will set whether the endpoint is live and valid
            endpoint.https_full_connection = False
            endpoint.https_valid = True
        else:
            endpoint.live = False
        logging.exception("{}: Error connecting.".format(endpoint.url))

    # And this is the parent of ConnectionError and other things.
    # For example, "too many redirects".
    # See https://github.com/kennethreitz/requests/blob/master/requests/exceptions.py
    except requests.exceptions.RequestException as err:
        endpoint.live = False
        logging.exception("{}: Unexpected other requests exception.".format(endpoint.url))
        return

    except Exception as err:
        endpoint.unknown_error = True
        logging.exception("{}: Unexpected other unknown exception during initial request.".format(endpoint.url))
        return

    # Run SSLyze to see if there are any errors
    if(endpoint.protocol == "https"):
        https_check(endpoint)
        # Double-check in case sslyze failed the first time, but the regular conneciton succeeded
        if(endpoint.live is False and req is not None):
            logging.warning("{}: Trying sslyze again since it connected once already.".format(endpoint.url))
            endpoint.live = True
            endpoint.https_valid = True
            https_check(endpoint)
            if(endpoint.live is False):
                # sslyze failed so back everything out and don't continue analyzing the existing response
                req = None
                endpoint.https_valid = False
                endpoint.https_full_connection = False

    if req is None:
        # Ensure that full_connection is set to False if we didn't get a response
        if endpoint.protocol == "https":
            endpoint.https_full_connection = False
        return

    # try to get IP address if we can
    try:
        if req.raw.closed is False:
            ip = req.raw._connection.sock.socket.getpeername()[0]
            if endpoint.ip is None:
                endpoint.ip = ip
            else:
                if endpoint.ip != ip:
                    logging.info("{}: Endpoint IP is already {}, but requests IP is {}.".format(endpoint.url, endpoint.ip, ip))
    except Exception:
        # if the socket has already closed, it will throw an exception, but this is just best effort, so ignore it
        logging.exception("Error closing socket")

    # Endpoint is live, analyze the response.
    endpoint.headers = req.headers

    endpoint.status = req.status_code

    if (req.headers.get('Server') is not None):
        endpoint.server_header = req.headers.get('Server')
        # *** in the future add logic to convert header to server version if known

    if (req.headers.get('Location') is not None) and str(endpoint.status).startswith('3'):
        endpoint.redirect = True
        logging.warning("{}: Found redirect.".format(endpoint.url))

    if endpoint.redirect:
        try:
            location_header = req.headers.get('Location')
            # Absolute redirects (e.g. "https://example.com/Index.aspx")
            if location_header.startswith("http:") or location_header.startswith("https:"):
                immediate = location_header

            # Relative redirects (e.g. "Location: /Index.aspx").
            # Construct absolute URI, relative to original request.
            else:
                immediate = urllib.parse.urljoin(endpoint.url, location_header)

            # Chase down the ultimate destination, ignoring any certificate warnings.
            ultimate_req = None
        except Exception as err:
            endpoint.unknown_error = True
            logging.exception("{}: Unexpected other unknown exception when handling Requests Header.".format(endpoint.url))

        try:
            with ping(endpoint.url, allow_redirects=True, verify=False) as ultimate_req:
                pass
        except (requests.exceptions.RequestException, OpenSSL.SSL.Error):
            # Swallow connection errors, but we won't be saving redirect info.
            logging.exception("Connection error")
        except Exception as err:
            endpoint.unknown_error = True
            logging.exception("{}: Unexpected other unknown exception when handling redirect.".format(endpoint.url))
            return

        try:
            # Now establish whether the redirects were:
            # * internal (same exact hostname),
            # * within the zone (any subdomain within the parent domain)
            # * external (on some other parent domain)

            # The hostname of the endpoint (e.g. "www.agency.gov")
            subdomain_original = urllib.parse.urlparse(endpoint.url).hostname
            # The parent domain of the endpoint (e.g. "agency.gov")
            base_original = parent_domain_for(subdomain_original)

            # The hostname of the immediate redirect.
            # The parent domain of the immediate redirect.
            subdomain_immediate = urllib.parse.urlparse(immediate).hostname
            base_immediate = parent_domain_for(subdomain_immediate)

            endpoint.redirect_immediately_to = immediate
            endpoint.redirect_immediately_to_https = immediate.startswith("https://")
            endpoint.redirect_immediately_to_http = immediate.startswith("http://")
            endpoint.redirect_immediately_to_external = (base_original != base_immediate)
            endpoint.redirect_immediately_to_subdomain = (
                (base_original == base_immediate) and
                (subdomain_original != subdomain_immediate)
            )

            # We're interested in whether an endpoint redirects to the www version
            # of itself (not whether it redirects to www prepended to any other
            # hostname, even within the same parent domain).
            endpoint.redirect_immediately_to_www = (
                subdomain_immediate == ("www.%s" % subdomain_original)
            )

            if ultimate_req is not None:
                # For ultimate destination, use the URL we arrived at,
                # not Location header. Auto-resolves relative redirects.
                eventual = ultimate_req.url

                # The hostname of the eventual destination.
                # The parent domain of the eventual destination.
                subdomain_eventual = urllib.parse.urlparse(eventual).hostname
                base_eventual = parent_domain_for(subdomain_eventual)

                endpoint.redirect_eventually_to = eventual
                endpoint.redirect_eventually_to_https = eventual.startswith("https://")
                endpoint.redirect_eventually_to_http = eventual.startswith("http://")
                endpoint.redirect_eventually_to_external = (base_original != base_eventual)
                endpoint.redirect_eventually_to_subdomain = (
                    (base_original == base_eventual) and
                    (subdomain_original != subdomain_eventual)
                )

            # If we were able to make the first redirect, but not the ultimate redirect,
            # and if the immediate redirect is external, then it's accurate enough to
            # say that the eventual redirect is the immediate redirect, since you're capturing
            # the domain it's going to.
            # This also avoids "punishing" the domain for configuration issues of the site
            # it redirects to.
            elif endpoint.redirect_immediately_to_external:
                endpoint.redirect_eventually_to = endpoint.redirect_immediately_to
                endpoint.redirect_eventually_to_https = endpoint.redirect_immediately_to_https
                endpoint.redirect_eventually_to_http = endpoint.redirect_immediately_to_http
                endpoint.redirect_eventually_to_external = endpoint.redirect_immediately_to_external
                endpoint.redirect_eventually_to_subdomain = endpoint.redirect_immediately_to_subdomain
        except Exception as err:
            endpoint.unknown_error = True
            logging.exception("{}: Unexpected other unknown exception when establishing redirects.".format(endpoint.url))


def hsts_check(endpoint):
    """
    Given an endpoint and its detected headers, extract and parse
    any present HSTS header, decide what HSTS properties are there.
    Disqualify domains with a bad host, they won't work as valid HSTS.
    """
    try:
        if endpoint.https_bad_hostname:
            endpoint.hsts = False
            return

        header = endpoint.headers.get("Strict-Transport-Security")

        if header is None:
            endpoint.hsts = False
            return

        endpoint.hsts = True
        endpoint.hsts_header = header

        # Set max age to the string after max-age
        # TODO: make this more resilient to pathological HSTS headers.

        # handle multiple HSTS headers, requests comma-separates them
        first_pass = re.split(r',\s?', header)[0]
        second_pass = re.sub(r'\'', '', first_pass)

        temp = re.split(r';\s?', second_pass)

        if "max-age" in header.lower():
            endpoint.hsts_max_age = int(temp[0][len("max-age="):])

        if endpoint.hsts_max_age is None or endpoint.hsts_max_age <= 0:
            endpoint.hsts = False
            return

        # check if hsts includes sub domains
        if 'includesubdomains' in header.lower():
            endpoint.hsts_all_subdomains = True

        # Check is hsts has the preload flag
        if 'preload' in header.lower():
            endpoint.hsts_preload = True
    except Exception as err:
        endpoint.unknown_error = True
        logging.exception("{}: Unknown exception when handling HSTS check.".format(endpoint.url))
        return


def https_check(endpoint):
    """
    Uses sslyze to figure out the reason the endpoint wouldn't verify.
    """

    # remove the https:// from prefix for sslyze
    try:
        hostname = endpoint.url[8:]
        server_location = ServerNetworkLocationViaDirectConnection.with_ip_address_lookup(hostname, 443)
        server_tester = ServerConnectivityTester()
        server_info = server_tester.perform(server_location)
        endpoint.live = True
        ip = server_location.ip_address
        if endpoint.ip is None:
            endpoint.ip = ip
        else:
            if endpoint.ip != ip:
                logging.info("{}: Endpoint IP is already {}, but requests IP is {}.".format(endpoint.url, endpoint.ip, ip))
        if server_info.tls_probing_result.client_auth_requirement.name == 'REQUIRED':
            endpoint.https_client_auth_required = True
            logging.warning("{}: Client Authentication REQUIRED".format(endpoint.url))
    except ConnectionToServerFailed as err:
        endpoint.live = False
        endpoint.https_valid = False
        logging.exception("{}: Error in sslyze server connectivity check when connecting to {}".format(endpoint.url, err.server_info.hostname))
        return
    except Exception as err:
        endpoint.unknown_error = True
        logging.exception("{}: Unknown exception in sslyze server connectivity check.".format(endpoint.url))
        return

    try:
        cert_plugin_result = None
        command = ScanCommand.CERTIFICATE_INFO
        scanner = Scanner()
        scan_request = ServerScanRequest(server_info=server_info, scan_commands=[command])
        scanner.queue_scan(scan_request)
        # Retrieve results from generator object
        scan_result = [x for x in scanner.get_results()][0]
        cert_plugin_result = scan_result.scan_commands_results['certificate_info']
    except Exception as err:
        try:
            if "timed out" in str(err):
                logging.exception("{}: Retrying sslyze scanner certificate plugin.".format(endpoint.url))
                scanner.queue_scan(scan_request)
                # Retrieve results from generator object
                scan_result = [x for x in scanner.get_results()][0]
                cert_plugin_result = scan_result.scan_commands_results['certificate_info']
            else:
                logging.exception("{}: Unknown exception in sslyze scanner certificate plugin.".format(endpoint.url))
                endpoint.unknown_error = True
                # We could make this False, but there was an error so
                # we don't know
                endpoint.https_valid = None
                return
        except Exception:
            logging.exception("{}: Unknown exception in sslyze scanner certificate plugin.".format(endpoint.url))
            endpoint.unknown_error = True
            # We could make this False, but there was an error so we
            # don't know
            endpoint.https_valid = None
            return

    try:
        public_trust = True
        custom_trust = True
        public_not_trusted_string = ""
        validation_results = cert_plugin_result.certificate_deployments[0].path_validation_results
        for result in validation_results:
            if result.was_validation_successful:
                # We're assuming that it is trusted to start with
                pass
            else:
                if 'Custom' in result.trust_store.name:
                    custom_trust = False
                else:
                    public_trust = False
                    if len(public_not_trusted_string) > 0:
                        public_not_trusted_string += ", "
                    public_not_trusted_string += result.trust_store.name
        if public_trust:
            logging.warning("{}: Publicly trusted by common trust stores.".format(endpoint.url))
        else:
            logging.warning("{}: Not publicly trusted - not trusted by {}.".format(endpoint.url, public_not_trusted_string))
        custom_trust = None
        endpoint.https_public_trusted = public_trust
        endpoint.https_custom_trusted = custom_trust
    except Exception as err:
        # Ignore exception
        logging.exception("{}: Unknown exception examining trust.".format(endpoint.url))

    # Default endpoint assessments to False until proven True.
    endpoint.https_expired_cert = False
    endpoint.https_self_signed_cert = False
    endpoint.https_bad_chain = False
    endpoint.https_bad_hostname = False

    cert_chain = cert_plugin_result.certificate_deployments[0].received_certificate_chain

    # Check for missing SAN (Leaf certificate)
    leaf_cert = cert_chain[0]
    # Extract Subject Alternative Names
    san_list = extract_dns_subject_alternative_names(leaf_cert)
    # If an empty list was return, SAN(s) are missing. Bad hostname
    if isinstance(san_list, list) and len(san_list) == 0:
        endpoint.https_bad_hostname = True

    # If leaf certificate subject does NOT match hostname, bad hostname
    if not cert_plugin_result.certificate_deployments[0].leaf_certificate_subject_matches_hostname:
        endpoint.https_bad_hostname = True

    # Check for leaf certificate expiration/self-signature.
    if leaf_cert.not_valid_after < datetime.datetime.now():
        endpoint.https_expired_cert = True

    # Check to see if the cert is self-signed
    if leaf_cert.issuer is leaf_cert.subject:
        endpoint.https_self_signed_cert = True

    # Check certificate chain
    for cert in cert_chain[1:]:
        # Check for certificate expiration
        if cert.not_valid_after < datetime.datetime.now():
            endpoint.https_bad_chain = True

        # Check to see if the cert is self-signed
        if cert.issuer is (cert.subject or None):
            endpoint.https_bad_chain = True

    try:
        endpoint.https_cert_chain_len = len(cert_plugin_result.certificate_deployments[0].received_certificate_chain)
        if (
                endpoint.https_self_signed_cert is False and (
                    len(cert_plugin_result.certificate_deployments[0].received_certificate_chain) < 2
                )
        ):
            # *** TODO check that it is not a bad hostname and that the root cert is trusted before suggesting that it is an intermediate cert issue.
            endpoint.https_missing_intermediate_cert = True
            if(cert_plugin_result.verified_certificate_chain is None):
                logging.warning("{}: Untrusted certificate chain, probably due to missing intermediate certificate.".format(endpoint.url))
                logging.info("{}: Only {} certificates in certificate chain received.".format(endpoint.url, cert_plugin_result.received_certificate_chain.__len__()))
        else:
            endpoint.https_missing_intermediate_cert = False
    except Exception:
        logging.exception("Error while determining length of certificate chain")

    # If anything is wrong then https is not valid
    if (
        endpoint.https_expired_cert or
        endpoint.https_self_signed_cert or
        endpoint.https_bad_chain or
        endpoint.https_bad_hostname
    ):
        endpoint.https_valid = False


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


def initialize_external_data():
    """
    This function serves to load all of third party external data.
    This can be called explicitly by a library, as part of the setup needed
    before calling other library functions, or called as part of running
    inspect_domains() or CLI operation.
    If values are passed in to this function, they will be assigned to
    be the cached values. This allows a caller of the Python API to manage
    cached data in a customized way.
    It also potentially allows clients to pass in subsets of these lists,
    for testing or novel performance reasons.
    Otherwise, if the --cache-third-parties=[DIR] flag specifies a directory,
    all downloaded third party data will be cached in a directory, and
    used from cache on the next pshtt run instead of hitting the network.
    If no values are passed in, and no --cache-third-parties flag is used,
    then no cached third party data will be created or used, and pshtt will
    download the latest data from those third party sources.
    """
    global preload_list, preload_pending, suffix_list

    preload_list = load_preload_list()

    preload_pending = load_preload_pending()

    suffix_list, raw_content = load_suffix_list()


def load_preload_list():
    preload_json = None

    # Downloads the chromium preloaded domain list and sets it to a global set
    file_url = 'https://chromium.googlesource.com/chromium/src/net/+/master/http/transport_security_state_static.json?format=TEXT'

    try:
        request = requests.get(file_url)
    except (requests.exceptions.SSLError, requests.exceptions.ConnectionError) as err:
        logging.exception('Failed to fetch preload list: {}'.format(file_url))
        logging.debug('{}'.format(err))
        return []

    raw = request.content

    # To avoid parsing the contents of the file out of the source tree viewer's
    # HTML, we download it as a raw file. googlesource.com Base64-encodes the
    # file to avoid potential content injection issues, so we need to decode it
    # before using it. https://code.google.com/p/gitiles/issues/detail?id=7
    raw = base64.b64decode(raw).decode('utf-8')

    # The .json file contains '//' comments, which are not actually valid JSON,
    # and confuse Python's JSON decoder. Begone, foul comments!
    raw = ''.join([re.sub(r'^\s*//.*$', '', line)
                   for line in raw.splitlines()])

    preload_json = json.loads(raw)

    # For our purposes, we only care about entries that includeSubDomains
    fully_preloaded = []
    for entry in preload_json['entries']:
        if entry.get('include_subdomains', False) is True:
            fully_preloaded.append(entry['name'])

    return fully_preloaded


def load_preload_pending():
    """
    Fetch the Chrome preload pending list.
    """
    pending_url = "https://hstspreload.org/api/v2/pending"

    try:
        request = requests.get(pending_url)
    except (requests.exceptions.SSLError, requests.exceptions.ConnectionError) as err:
        logging.exception('Failed to fetch pending preload list: {}'.format(pending_url))
        logging.debug('{}'.format(err))
        return []

    # TODO: abstract Py 2/3 check out to utils
    if sys.version_info[0] < 3:
        raw = request.content
    else:
        raw = str(request.content, 'utf-8')

    pending_json = json.loads(raw)

    pending = []
    for entry in pending_json:
        if entry.get('include_subdomains', False) is True:
            pending.append(entry['name'])

    return pending


def load_suffix_list():
    # File does not exist, download current list and cache it at given location.
    try:
        cache_file = publicsuffix.fetch()
    except urllib.error.URLError as err:
        logging.exception("Unable to download the Public Suffix List...")
        return []
    content = cache_file.readlines()
    suffixes = publicsuffix.PublicSuffixList(content)
    return suffixes, content
