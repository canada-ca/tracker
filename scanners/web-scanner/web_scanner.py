import json

from scan.tls_scanner.tls_scanner import TLSScanner
from scan.endpoint_scanner.endpoint_scanner import scan_http


def scan_web(domain, ip_address=None):
    tls_result = TLSScanner(domain=domain, ip_address=ip_address).run()
    endpoint_result = scan_http(domain, ip_address=ip_address).dict()

    return {"tls_result": tls_result, "endpoint_result": endpoint_result}
