import pytest

from web_processor.php_detection import php_result_for_run

DOMAIN = "a.gc.ca"
URL = f"http://{DOMAIN}"


def hop(headers, uri=URL, status_code=200, error=None):
    response = None if error else {"statusCode": status_code, "headers": headers}
    return {"uri": uri, "error": error, "connection": response}


def scan(*hops):
    return {"connection_results": {"httpChainResult": {"connections": list(hops)}, "httpsChainResult": None}}


def https_scan(*hops):
    return {"connection_results": {"httpChainResult": None, "httpsChainResult": {"connections": list(hops)}}}


@pytest.mark.parametrize(
    "x_powered_by, status",
    [
        ("PHP", "unknown_version"),
        ("PHP/8.3", "unknown_version"),
        ("PHP/5.3.29", "not_affected"),
        ("PHP/5.4.16", "vulnerable"),
        ("PHP/7.4.34-dev", "vulnerable"),
        ("PHP/8.1.34", "vulnerable"),
        ("PHP/8.2.34", "vulnerable"),
        ("PHP/8.2.35", "not_affected"),
        ("PHP/8.3.35", "vulnerable"),
        ("PHP/8.3.36", "not_affected"),
        ("PHP/8.4.26", "vulnerable"),
        ("PHP/8.4.27", "not_affected"),
        ("PHP/8.5.11", "vulnerable"),
        ("PHP/8.5.12", "not_affected"),
        ("PHP/8.6.0", "not_affected"),
    ],
)
def test_status_of_the_version_shown(x_powered_by, status):
    assert php_result_for_run([scan(hop({"X_Powered_By": x_powered_by}))], DOMAIN)["status"] == status


@pytest.mark.parametrize(
    "hops, evidence",
    [
        ([hop({"X_Powered_By": "PHP"})], ["X-Powered-By: PHP"]),
        ([hop({"Server": "Apache/2.4.41 (Ubuntu) PHP/7.4.3"})], ["Server: PHP/7.4.3"]),
        ([hop({"Set_Cookie": "PHPSESSID=abc; path=/"})], ["PHPSESSID cookie"]),
        ([hop({"Set_Cookie": "XSRF-TOKEN=abc, laravel_session=def"})], ["Laravel session cookie"]),
        ([hop({"Link": '<https://a.gc.ca/wp-json/>; rel="https://api.w.org/"'})], ["WordPress REST API Link header"]),
        ([hop({"X_Redirect_By": "WordPress"})], ["X-Redirect-By: WordPress"]),
        ([hop({"X_Pingback": "https://a.gc.ca/xmlrpc.php"})], ["X-Pingback header (WordPress)"]),
        ([hop({"X_Generator": "Drupal 10", "X_Drupal_Cache": "HIT"})], ["X-Generator: Drupal 10", "X-Drupal header"]),
        ([hop({}, uri=f"{URL}/index.php")], [f".php URL answered 200: {URL}/index.php"]),
        ([hop({"x_powered_by": "PHP/8.4.27"}, uri="http://A.GC.CA/")], ["X-Powered-By: PHP/8.4.27"]),
    ],
)
def test_php_evidence(hops, evidence):
    assert php_result_for_run([scan(*hops)], DOMAIN)["evidence"] == evidence


@pytest.mark.parametrize(
    "hops",
    [
        [hop({"X_Powered_By": "ASP.NET"})],
        [hop({}, uri=f"{URL}/index.php", status_code=301)],
        [hop({}, uri=f"{URL}/index.php", status_code=404)],
        [hop({}, uri=f"{URL}/index.php", error="CONNECTION_ERROR")],
        [hop({"Server": "Apache mod_suphp/0.7.1"})],
        [hop({"Location": "https://a.gc.ca/PHP/8.1.2"})],
        [
            hop({"Location": "https://cms.example.com/login.php"}, status_code=302),
            hop({"X_Powered_By": "PHP/7.4.33"}, uri="https://cms.example.com/login.php"),
        ],
    ],
)
def test_no_php_seen(hops):
    assert php_result_for_run([scan(*hops)], DOMAIN) is None


def test_worst_ip_in_the_run_decides():
    scans = [
        scan(hop({"Set_Cookie": "PHPSESSID=abc; path=/"})),
        https_scan(
            hop({"Server": "Apache/2.4.52 (Ubuntu)", "X_Powered_By": "PHP/8.1.2-1ubuntu2.19"}, uri=f"https://{DOMAIN}")
        ),
        scan(hop({"X_Powered_By": "PHP/8.4.27"})),
        {"connection_results": None},
    ]

    assert php_result_for_run(scans, DOMAIN) == {
        "status": "vulnerable",
        "version": "PHP/8.1.2-1ubuntu2.19",
        "advisories": ["AL26-026"],
        "cves": ["CVE-2026-109618", "CVE-2026-109619"],
        "evidence": ["X-Powered-By: PHP/8.1.2-1ubuntu2.19"],
    }
