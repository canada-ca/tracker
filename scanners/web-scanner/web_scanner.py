import json
from dataclasses import asdict

from scan.tls_scanner.tls_scanner import TLSScanner
from scan.endpoint_chain_scanner.endpoint_chain_scanner import scan_chain


def scan_web(domain, ip_address=None):
    tls_result = TLSScanner(domain=domain, ip_address=ip_address).run()
    if not ip_address:
        ip_address = tls_result.get("server_location").get("ip_address")
    chain_result = scan_chain(domain, ip_address=ip_address)

    return {
        "tls_result": tls_result,
        "chain_result": asdict(chain_result)
    }
