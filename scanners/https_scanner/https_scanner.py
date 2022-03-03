import os
import time
import argparse

import dns.resolver
import sys
import logging
from dns.resolver import NXDOMAIN, NoAnswer


logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


def obj_to_dict(obj, classkey=None):
    if isinstance(obj, dict):
        data = {}
        for (k, v) in obj.items():
            data[k] = obj_to_dict(v, classkey)
        return data
    elif hasattr(obj, "_ast"):
        return obj_to_dict(obj._ast())
    elif hasattr(obj, "__iter__"):
        return [obj_to_dict(v, classkey) for v in obj]
    elif hasattr(obj, "__dict__"):
        data = dict([(key, obj_to_dict(value, classkey))
                     for key, value in obj.__dict__.items()
                     if not callable(value) and not key.startswith('_') and key not in ['name']])
        if classkey is not None and hasattr(obj, "__class__"):
            data[classkey] = obj.__class__.__name__
        return data
    else:
        return obj


def scan_http(domain, ip_address=None):
    """
    Scan a domain for DNS records
    :param str domain: Name of domain to scan
    :param ip_address: IP address to be scanned. If not used, an IP will be retrived from DNS
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
        logging.info(f"No domain records found for {domain}.")
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
    scan_result.resolve_chain = str(a_records.response.answer[0]).splitlines()

    # Get first CNAME record (in case there is no A record in chain). Checking if chain is valid.
    try:
        cname_record = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.CNAME)
    except NoAnswer:
        cname_record = None
        pass

    if cname_record is not None:
        scan_result.cname_record = cname_record

    # Get MX records
    try:
        mx_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.MX)
    except NoAnswer:
        mx_records = []

    scan_result.mx_records = [str(mx_record) for mx_record in mx_records]

    # Run DMARC check
    dmarc_start_time = time.monotonic()
    logging.info(f"Starting DMARC scanner for '{domain}'")
    dmarc_scanner = DMARCScanner(domain)
    scan_result.dmarc = dmarc_scanner.run()
    logging.info(f"DMARC scan elapsed time: {time.monotonic() - dmarc_start_time}")

    # Run DKIM check
    if len(dkim_selectors) != 0:
        # DKIM scan
        dkim_start_time = time.time()
        logging.info(f"Starting DKIM scanner for '{domain}'")
        dkim_scanner = DKIMScanner(domain, dkim_selectors)
        scan_result.dkim = dkim_scanner.run()
        logging.info(f"DKIM scan elapsed time: {time.monotonic() - dkim_start_time}")
    else:
        scan_result.dkim = {"error": "missing"}

    logging.info(f"DNS results for '{domain}': {scan_result.__dict__}")

    return scan_result.__dict__


def scan_https(domain, ip_address=None):
    """
    Scan a domain for DNS records
    :param str domain: Name of domain to scan
    :param ip_address: IP address to be scanned. If not used, an IP will be retrived from DNS
    :return: The results from the domain scan
    """

    print(f"Scanning domain: {domain}")

    if dkim_selectors is None:
        dkim_selectors = []

    scan_result = DNSScanResult()

    # Check if domain exists
    try:
        dns.resolver.resolve(domain, rdtype=dns.rdatatype.SOA)
    except NXDOMAIN:
        logging.info(f"No domain records found for {domain}.")
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
    scan_result.resolve_chain = str(a_records.response.answer[0]).splitlines()

    # Get first CNAME record (in case there is no A record in chain). Checking if chain is valid.
    try:
        cname_record = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.CNAME)
    except NoAnswer:
        cname_record = None
        pass

    if cname_record is not None:
        scan_result.cname_record = cname_record

    # Get MX records
    try:
        mx_records = dns.resolver.resolve(qname=domain, rdtype=dns.rdatatype.MX)
    except NoAnswer:
        mx_records = []

    scan_result.mx_records = [str(mx_record) for mx_record in mx_records]

    # Run DMARC check
    dmarc_start_time = time.monotonic()
    logging.info(f"Starting DMARC scanner for '{domain}'")
    dmarc_scanner = DMARCScanner(domain)
    scan_result.dmarc = dmarc_scanner.run()
    logging.info(f"DMARC scan elapsed time: {time.monotonic() - dmarc_start_time}")

    # Run DKIM check
    if len(dkim_selectors) != 0:
        # DKIM scan
        dkim_start_time = time.time()
        logging.info(f"Starting DKIM scanner for '{domain}'")
        dkim_scanner = DKIMScanner(domain, dkim_selectors)
        scan_result.dkim = dkim_scanner.run()
        logging.info(f"DKIM scan elapsed time: {time.monotonic() - dkim_start_time}")
    else:
        scan_result.dkim = {"error": "missing"}

    logging.info(f"DNS results for '{domain}': {scan_result.__dict__}")

    return scan_result.__dict__



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scan a domain for DNS records.')
    parser.add_argument('domain', metavar='domain', type=str,
                        help='the domain to scan')

    args = parser.parse_args()
    print(scan_domain(args.domain))
