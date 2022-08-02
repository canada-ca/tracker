from dataclasses import dataclass
import time

import dns.resolver
from checkdmarc import *
from dns.resolver import NXDOMAIN, NoAnswer

from dns_scanner.email_scanners import DKIMScanner, DMARCScanner

logger = logging.getLogger(__name__)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


@dataclass
class DNSScanResult:
    domain: str
    base_domain: str = None
    record_exists: bool = None
    rcode: str = None
    resolve_chain: list[list[str]] = None
    resolve_ips: [str] = None
    cname_record: str = None
    mx_records: [str] = None
    ns_records: [str] = None
    dkim: dict = None
    spf: dict = None
    dmarc: dict = None


def scan_domain(domain, dkim_selectors=None):
    """
    Scan a domain for DNS records
    :param str domain: Name of domain to scan
    :param list[str] dkim_selectors: Array of DKIM selectors
    :return: The results from the domain scan
    :rtype: dict
    """

    if dkim_selectors is None:
        dkim_selectors = []

    scan_result = DNSScanResult(domain)

    # Check if domain exists
    try:
        exist_response = dns.resolver.resolve(domain, rdtype=dns.rdatatype.SOA, raise_on_no_answer=False)
        scan_result.rcode = dns.rcode.to_text(exist_response.response.rcode())
    except NXDOMAIN as nxdomain_error:
        logger.info(f"No domain records found for {domain}.")
        scan_result.rcode = dns.rcode.to_text(nxdomain_error.kwargs["responses"][nxdomain_error.kwargs["qnames"][0]].rcode())
        scan_result.record_exists = False
        return scan_result.__dict__

    scan_result.record_exists = True

    # Get chaining results (A and CNAME records)
    try:
        a_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.A)
    except NoAnswer:
        a_records = None

    scan_result.resolve_ips = [a_record.to_text() for a_record in a_records]
    scan_result.resolve_chain = [str(answer).splitlines() for answer in a_records.response.answer]

    # Get first CNAME record (in case there is no A record in chain). Checking if chain is valid.
    try:
        cname_record = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.CNAME)
    except NoAnswer:
        cname_record = None
        pass

    if cname_record is not None:
        scan_result.cname_record = [str(answer) for answer in cname_record.response.answer]

    # Run DMARC scan
    dmarc_start_time = time.monotonic()
    logger.info(f"Starting DMARC scanner for '{domain}'")
    dmarc_scanner = DMARCScanner(domain)
    dmarc_scan_result = dmarc_scanner.run()
    scan_result.base_domain = dmarc_scan_result.get("base_domain", "")
    scan_result.ns_records = dmarc_scan_result.get("ns", {})
    scan_result.mx_records = dmarc_scan_result.get("mx", {})
    scan_result.spf = dmarc_scan_result.get("spf", {})
    scan_result.dmarc = dmarc_scan_result.get("dmarc", {})
    logger.info(f"DMARC scan elapsed time: {time.monotonic() - dmarc_start_time}")

    try:
        # Run DKIM scan
        dkim_start_time = time.time()
        logger.info(f"Starting DKIM scanner for '{domain}'")
        dkim_scanner = DKIMScanner(domain, dkim_selectors)
        scan_result.dkim = dkim_scanner.run()
        logger.info(f"DKIM scan elapsed time: {time.monotonic() - dkim_start_time}")
    except TimeoutError:
        print("TIMEOUT")

    logger.info(f"DNS results for '{domain}': {scan_result.__dict__}")

    return scan_result.__dict__
