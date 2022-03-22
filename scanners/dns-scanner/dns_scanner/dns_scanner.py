from dataclasses import dataclass
import time

import dns.resolver
from checkdmarc import *
from dns.resolver import NXDOMAIN, NoAnswer

from .email_scanners import DKIMScanner, DMARCScanner

logger = logging.getLogger(__name__)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


@dataclass
class DNSScanResult:
    record_exists: bool = None
    resolve_chain: list[list[str]] = None
    resolve_ips: [str] = None
    mx_records: [str] = None
    cname_records: str = None
    dkim: dict = None
    dmarc: dict = None


def scan_domain(domain, dkim_selectors=None):
    """
    Scan a domain for DNS records
    :param str domain: Name of domain to scan
    :param list[str] dkim_selectors: Array of DKIM selectors
    :return: The results from the domain scan
    :rtype: dict
    """

    print(f"Scanning domain: {domain}")

    if dkim_selectors is None:
        dkim_selectors = []

    scan_result = DNSScanResult()

    # Check if domain exists
    try:
        dns.resolver.resolve(domain, rdtype=dns.rdatatype.SOA)
    except NXDOMAIN:
        logger.info(f"No domain records found for {domain}.")
        scan_result.record_exists = False
        return scan_result
    except:
        pass

    scan_result.record_exists = True

    # Get chaining results (A and CNAME records)
    try:
        a_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.A)
    except NoAnswer:
        a_records = []

    scan_result.resolve_ips = [a_record.to_text() for a_record in a_records]
    scan_result.resolve_chain = [str(answer).splitlines() for answer in a_records.response.answer]

    # Get first CNAME record (in case there is no A record in chain). Checking if chain is valid.
    try:
        cname_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.CNAME)
    except NoAnswer:
        cname_records = None
        pass

    if cname_records is not None:
        scan_result.cname_records = [str(answer) for answer in cname_records.response.answer]

    # Get MX records
    try:
        mx_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.MX)
    except NoAnswer:
        mx_records = []

    scan_result.mx_records = [str(mx_record) for mx_record in mx_records]

    # Run DMARC scan
    dmarc_start_time = time.monotonic()
    logger.info(f"Starting DMARC scanner for '{domain}'")
    dmarc_scanner = DMARCScanner(domain)
    scan_result.dmarc = dmarc_scanner.run()
    logger.info(f"DMARC scan elapsed time: {time.monotonic() - dmarc_start_time}")

    try:
        # Run DKIM scan
        if len(dkim_selectors) != 0:
            # DKIM scan
            dkim_start_time = time.time()
            logger.info(f"Starting DKIM scanner for '{domain}'")
            dkim_scanner = DKIMScanner(domain, dkim_selectors)
            scan_result.dkim = dkim_scanner.run()
            logger.info(f"DKIM scan elapsed time: {time.monotonic() - dkim_start_time}")
        else:
            scan_result.dkim = {"error": "missing"}
    except TimeoutError:
        print("TIMEOUT")

    logger.info(f"DNS results for '{domain}': {scan_result.__dict__}")

    return scan_result.__dict__
