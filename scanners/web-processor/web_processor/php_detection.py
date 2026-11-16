import re
from urllib.parse import urlsplit

AL26_026 = {
    "id": "AL26-026",
    "cves": ["CVE-2026-109618", "CVE-2026-109619"],
    "oldest_affected_branch": (5, 4),
    "newest_branch_without_fix": (8, 1),
    "first_fixed_patch": {(8, 2): 35, (8, 3): 36, (8, 4): 27, (8, 5): 12},
}

VULNERABLE = "vulnerable"
UNKNOWN_VERSION = "unknown_version"
NOT_AFFECTED = "not_affected"
WORST_STATUS_FIRST = [VULNERABLE, UNKNOWN_VERSION, NOT_AFFECTED]

PHP_VERSION_RE = re.compile(r"(?<![A-Za-z])PHP/(\d+)\.(\d+)(?:\.(\d+))?[-+~.\w]*", re.IGNORECASE)
PHP_PAGE_RE = re.compile(r"\.php\d?(/|$)", re.IGNORECASE)


def classify_version(version):
    branch = version["branch"]
    patch = version["patch"]
    if branch < AL26_026["oldest_affected_branch"]:
        return NOT_AFFECTED
    if branch <= AL26_026["newest_branch_without_fix"]:
        return VULNERABLE
    if branch not in AL26_026["first_fixed_patch"]:
        return NOT_AFFECTED
    if patch is None:
        return UNKNOWN_VERSION
    if patch < AL26_026["first_fixed_patch"][branch]:
        return VULNERABLE
    return NOT_AFFECTED


def php_versions_shown(headers):
    versions = []
    for header in ("Server", "X-Powered-By"):
        for match in PHP_VERSION_RE.finditer(headers.get(header.lower(), "")):
            major, minor, patch = match.groups()
            versions.append(
                {
                    "label": f"{header}: {match.group(0)}",
                    "shown": match.group(0),
                    "branch": (int(major), int(minor)),
                    "patch": int(patch) if patch is not None else None,
                }
            )
    return versions


def php_page_answered(hop):
    if hop["error"] or hop["status_code"] is None or not 200 <= hop["status_code"] < 300:
        return False
    return bool(PHP_PAGE_RE.search(urlsplit(hop["uri"]).path))


def php_signs_without_a_version(hop):
    headers = hop["headers"]
    powered_by = headers.get("x-powered-by", "")
    cookies = headers.get("set-cookie", "").lower()
    link = headers.get("link", "")
    generator = headers.get("x-generator", "")
    signs = []
    if "php" in powered_by.lower() and not PHP_VERSION_RE.search(powered_by):
        signs.append(f"X-Powered-By: {powered_by}")
    if "phpsessid" in cookies:
        signs.append("PHPSESSID cookie")
    if "laravel_session" in cookies:
        signs.append("Laravel session cookie")
    if 'rel="https://api.w.org/"' in link:
        signs.append("WordPress REST API Link header")
    if "wordpress" in headers.get("x-redirect-by", "").lower():
        signs.append("X-Redirect-By: WordPress")
    if "x-pingback" in headers:
        signs.append("X-Pingback header (WordPress)")
    if "drupal" in generator.lower():
        signs.append(f"X-Generator: {generator}")
    if any(name.startswith("x-drupal-") for name in headers):
        signs.append("X-Drupal header")
    if php_page_answered(hop):
        signs.append(f".php URL answered {hop['status_code']}: {hop['uri']}")
    return signs


def own_hops(connection_results, domain_name):
    hops = []
    for chain in ("httpChainResult", "httpsChainResult"):
        for request in ((connection_results or {}).get(chain) or {}).get("connections") or []:
            uri = request.get("uri") or ""
            if urlsplit(uri).hostname != domain_name.lower():
                continue
            response = request.get("connection") or {}
            headers = response.get("headers") or {}
            hops.append(
                {
                    "uri": uri,
                    "error": request.get("error"),
                    "status_code": response.get("statusCode"),
                    "headers": {name.replace("_", "-").lower(): str(value) for name, value in headers.items()},
                }
            )
    return hops


def worst_first(status, version):
    if version is None:
        return WORST_STATUS_FIRST.index(status), (float("inf"),)
    patch = -1 if version["patch"] is None else version["patch"]
    return WORST_STATUS_FIRST.index(status), (*version["branch"], patch)


def ip_result(connection_results, domain_name):
    hops = own_hops(connection_results, domain_name)
    versions = [version for hop in hops for version in php_versions_shown(hop["headers"])]
    signs = [sign for hop in hops for sign in php_signs_without_a_version(hop)]
    evidence = list(dict.fromkeys([version["label"] for version in versions] + signs))
    if not evidence:
        return None
    if not versions:
        return {"status": UNKNOWN_VERSION, "version": None, "evidence": evidence}
    deciding_version = min(versions, key=lambda version: worst_first(classify_version(version), version))
    return {"status": classify_version(deciding_version), "version": deciding_version, "evidence": evidence}


def php_result_for_run(completed_web_scans, domain_name):
    ip_results = [ip_result(scan["connection_results"], domain_name) for scan in completed_web_scans]
    ip_results = [result for result in ip_results if result]
    if not ip_results:
        return None
    deciding = min(ip_results, key=lambda result: worst_first(result["status"], result["version"]))
    vulnerable = deciding["status"] == VULNERABLE
    return {
        "status": deciding["status"],
        "version": deciding["version"]["shown"] if deciding["version"] else None,
        "advisories": [AL26_026["id"]] if vulnerable else [],
        "cves": AL26_026["cves"] if vulnerable else [],
        "evidence": deciding["evidence"],
    }
