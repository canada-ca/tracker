from typing import Optional, TypedDict, Dict
from urllib.parse import urlparse

from scan.endpoint_chain_scanner.constants import DEFAULT_REQUEST_HEADERS, TIMEOUT
from scan.endpoint_chain_scanner.session_extensions import SessionOverrideRedirectWithIP, HostHeaderSSLAdapter


def parse_security_txt_response(resp, max_size=8192) -> dict:
    """
    Helper to parse and validate a security.txt response.
    Limits raw size to max_size bytes.
    """
    result = {
        "status_code": resp.status_code,
        "fields": {},
        "is_valid": False,
        "error": None,
        "raw": None,
    }
    content_type = resp.headers.get("Content-Type", "")
    raw_text = resp.text
    if len(raw_text) > max_size:
        result["error"] = f"Response too large ({len(raw_text)} bytes)"
        return result
    # Only store raw if not HTML/404/empty
    if (
        "<html" in raw_text.lower() or
        "text/html" in content_type.lower() or
        resp.status_code == 404 or
        not raw_text.strip()
    ):
        result["is_valid"] = False
        result["error"] = "Response is HTML, 404, or empty."
    else:
        result["raw"] = raw_text
        for line in raw_text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ':' in line:
                k, v = line.split(':', 1)
                result["fields"][k.strip()] = v.strip()
        if result["fields"]:
            result["is_valid"] = True
    return result


class FetchResult(TypedDict):
    path: str
    url: str
    status_code: Optional[int]
    fields: Dict[str, str]
    is_valid: bool
    error: Optional[str]
    raw: Optional[str]
    redirected: bool
    redirect_location: Optional[str]
    redirect_status_code: Optional[int]


def fetch_security_txt(domain: str, ip_address: Optional[str] = None) -> list:
    """
    Fetch and parse the security.txt file for a domain, optionally using a specific IP.
    """
    paths = ["/.well-known/security.txt", "/security.txt"]
    host = domain
    target = ip_address if ip_address else domain
    ip_override_map = {domain: ip_address} if ip_address else {}
    results = []
    with SessionOverrideRedirectWithIP(ip_override_map=ip_override_map) as session:
        session.mount("https://", HostHeaderSSLAdapter())
        session.verify = False
        for path in paths:
            result: FetchResult = {
                "path": path,
                "url": f"https://{host}{path}",
                "status_code": None,
                "fields": {},
                "is_valid": False,
                "error": None,
                "raw": None,
                "redirected": False,
                "redirect_location": None,
                "redirect_status_code": None,
            }
            try:
                allow_redirects = False
                resp = session.get(
                    result["url"],
                    headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
                    timeout=TIMEOUT,
                    allow_redirects=allow_redirects,
                )
                parsed = parse_security_txt_response(resp)
                result.update(parsed)
                result["status_code"] = resp.status_code
                # Handle redirects
                if resp.is_redirect or resp.is_permanent_redirect:
                    location = resp.headers.get("Location")
                    result["redirect_location"] = location
                    result["redirected"] = True
                    if path == "/security.txt" and location:
                        expected_url = f"https://{host}/.well-known/security.txt"
                        if location == expected_url:
                            redirected_resp = session.get(
                                location,
                                headers={"Host": host, **DEFAULT_REQUEST_HEADERS},
                                timeout=TIMEOUT,
                                allow_redirects=False,
                            )
                            redirect_parsed = parse_security_txt_response(redirected_resp)
                            # Mark as redirected, update fields/status/raw
                            result["redirect_status_code"] = redirected_resp.status_code
                            result["fields"] = redirect_parsed["fields"]
                            result["is_valid"] = redirect_parsed["is_valid"]
                            result["raw"] = redirect_parsed["raw"]
                            result["error"] = redirect_parsed["error"]
                        else:
                            result["error"] = f"Redirect from /security.txt is not to {expected_url}: {location}"
                            result["is_valid"] = False
                    else:
                        result["error"] = f"Redirect not allowed for {path}: {location}"
                        result["is_valid"] = False
            except Exception as e:
                result["error"] = str(e)
            results.append(result)
    return results
