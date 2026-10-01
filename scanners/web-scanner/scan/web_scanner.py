import concurrent
import os
import socket
from concurrent.futures import ProcessPoolExecutor
import datetime
from dataclasses import asdict

from scan.tls_scanner.tls_scanner import scan_tls
from scan.tls_scanner.pqc_scanner import scan_pqc
from scan.endpoint_chain_scanner.endpoint_chain_scanner import scan_chain

PQC_SCAN_ENABLED = os.getenv("PQC_SCAN_ENABLED", "false").lower() in ("true", "1")


def scan_web(domain, ip_address=None, pqc_enabled=None):
    timestamp = str(datetime.datetime.now().astimezone())

    # Get IP address if not provided to ensure same IP address is used for TLS and chain scan
    if not ip_address:
        try:
            results = socket.getaddrinfo(
                domain, 80, socket.AF_UNSPEC, socket.SOCK_STREAM
            )
        except Exception:
            raise ValueError(f"Could not resolve {domain}")

        ipv4_address = None
        ipv6_address = None

        for family, socktype, proto, canonname, sockaddr in results:
            if family == socket.AF_INET and not ipv4_address:
                ipv4_address = sockaddr[0]  # Get the IPv4 address
                break
            elif family == socket.AF_INET6 and not ipv6_address:
                ipv6_address = sockaddr[0]  # Get the IPv6 address

        # Prefer IPv4 if available, otherwise use IPv6
        ip_address = ipv4_address or ipv6_address

    chain_result = scan_chain(domain, ip_address=ip_address)

    # Run TLS check in process pool as sslyze has a memory leak
    with concurrent.futures.ProcessPoolExecutor() as executor:
        future = executor.submit(scan_tls, domain=domain, ip_address=ip_address)
        tls_result = future.result()

    results = {
        "tls_result": asdict(tls_result),
        "chain_result": asdict(chain_result),
        "timestamp": timestamp,
    }

    if pqc_enabled is None:
        pqc_enabled = PQC_SCAN_ENABLED

    # Runs last so it cannot affect the connectivity or timing of the production scans
    if pqc_enabled:
        results["pqc_result"] = scan_pqc(domain, ip_address)

    return results
