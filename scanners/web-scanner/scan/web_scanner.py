import concurrent
from concurrent.futures import ProcessPoolExecutor
import datetime
from dataclasses import asdict

from scan.tls_scanner.tls_scanner import scan_tls
from scan.endpoint_chain_scanner.endpoint_chain_scanner import scan_chain


def scan_web(domain, ip_address=None):
    timestamp = str(datetime.datetime.now().astimezone())
    # Run TLS check in process pool as sslyze has a memory leak
    with concurrent.futures.ProcessPoolExecutor() as executor:
        future = executor.submit(scan_tls, domain=domain, ip_address=ip_address)
        tls_result = future.result()

    if (
        not ip_address
        and getattr(tls_result, "server_location", None)
        and getattr(tls_result.server_location, "ip_address", None)
    ):
        # set ip address to use same ip for tls scan and resolve chain
        ip_address = tls_result.server_location.ip_address
    chain_result = scan_chain(domain, ip_address=ip_address)

    return {
        "tls_result": asdict(tls_result),
        "chain_result": asdict(chain_result),
        "timestamp": timestamp,
    }
