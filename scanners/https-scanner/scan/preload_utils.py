import base64
import json
import logging
import re
import sys
import requests

logger = logging.getLogger(__name__)

def load_preload_list():
    preload_json = None

    # Downloads the chromium preloaded domain list and sets it to a global set
    file_url = "https://chromium.googlesource.com/chromium/src/net/+/master/http/transport_security_state_static.json?format=TEXT"

    try:
        request = requests.get(file_url)
    except (
    requests.exceptions.SSLError, requests.exceptions.ConnectionError) as err:
        logger.debug("Failed to fetch preload list: {}".format(file_url))
        logger.debug("{}".format(err))
        return []

    raw = request.content

    # To avoid parsing the contents of the file out of the source tree viewer's
    # HTML, we download it as a raw file. googlesource.com Base64-encodes the
    # file to avoid potential content injection issues, so we need to decode it
    # before using it. https://code.google.com/p/gitiles/issues/detail?id=7
    raw = base64.b64decode(raw).decode("utf-8")

    # The .json file contains '//' comments, which are not actually valid JSON,
    # and confuse Python's JSON decoder. Begone, foul comments!
    raw = "".join([re.sub(r"^\s*//.*$", "", line) for line in raw.splitlines()])

    preload_json = json.loads(raw)

    # For our purposes, we only care about entries that includeSubDomains
    fully_preloaded = []
    for entry in preload_json["entries"]:
        if entry.get("include_subdomains", False) is True:
            fully_preloaded.append(entry["name"])

    return fully_preloaded


def load_preload_pending():
    """
    Fetch the Chrome preload pending list.
    """
    pending_url = "https://hstspreload.org/api/v2/pending"

    try:
        request = requests.get(pending_url)
    except (
    requests.exceptions.SSLError, requests.exceptions.ConnectionError) as err:
        logger.debug(
            "Failed to fetch pending preload list: {}".format(pending_url))
        logger.debug("{}".format(err))
        return []

    # TODO: abstract Py 2/3 check out to utils
    if sys.version_info[0] < 3:
        raw = request.content
    else:
        raw = str(request.content, "utf-8")

    pending_json = json.loads(raw)

    pending = []
    for entry in pending_json:
        if entry.get("include_subdomains", False) is True:
            pending.append(entry["name"])

    return pending


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
