from dataclasses import dataclass
import time
import re
import os
import logging
import uuid

import dns.resolver
from dns.resolver import NXDOMAIN, NoAnswer, NoNameservers, Resolver, Answer
from dns.exception import Timeout

from dns_scanner.email_scanners import DKIMScanner, DMARCScanner

logger = logging.getLogger(__name__)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "20"))


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
    wildcard_sibling: bool = None
    wildcard_entry: bool = None


def get_dns_return_type(domain, query_type):
    try:
        default_resolver = dns.resolver.get_default_resolver()
        resolver_ip = default_resolver.nameservers[0]
        resolver_port = default_resolver.port
        query = dns.message.make_query(domain, query_type)
        exist_response = dns.query.udp_with_fallback(
            q=query, timeout=TIMEOUT, where=resolver_ip, port=resolver_port
        )[0]
        return dns.rcode.to_text(exist_response.rcode())
    except Timeout as e:
        logger.error(
            f"Timeout while checking if domain '{domain}' exists with query type '{dns.rdatatype.to_text(query_type)}': {e}"
        )
        return None
    except Exception as e:
        logger.error(
            f"Error while checking if domain '{domain}' exists with query type '${dns.rdatatype.to_text(query_type)}': {e}"
        )
        return None


def get_wildcard_status(domain: str, resolver: Resolver, a_records: Answer):
    result = {"wildcard_entry": None, "wildcard_sibling": None}
    # Check for wildcard entry
    try:
        # check two random subdomains for matching records
        result.wildcard_entry = False
        lower_level_domain = domain.split(".", 1)[1]
        random_sub1 = f"{uuid.uuid4().hex[:8]}.{domain}"
        random_sub2 = f"{uuid.uuid4().hex[:8]}.{domain}"

        random_sub1_record = dns.resolver.resolve(
            random_sub1,
            rdtype=dns.rdatatype.A,
            raise_on_no_answer=False,
        )
        random_sub2_record = dns.resolver.resolve(
            random_sub2,
            rdtype=dns.rdatatype.A,
            raise_on_no_answer=False,
        )

        if random_sub1_record is not None and random_sub2_record is not None:
            if (
                a_records is not None
                or random_sub1_record.response.answer[-1]
                == random_sub2_record.response.answer[-1]
            ):
                # check domain next level down for wildcard status. If next level down is wildcard entry, this domain is likely just a sibling
                lower_level_random1 = f"{uuid.uuid4().hex[:8]}.{lower_level_domain}"
                lower_level_random2 = f"{uuid.uuid4().hex[:8]}.{lower_level_domain}"

                lower_random_sub1_record = dns.resolver.resolve(
                    lower_level_random1,
                    rdtype=dns.rdatatype.A,
                    raise_on_no_answer=False,
                )
                lower_random_sub2_record = dns.resolver.resolve(
                    lower_level_random2,
                    rdtype=dns.rdatatype.A,
                    raise_on_no_answer=False,
                )
                if (
                    lower_random_sub1_record is None
                    and lower_random_sub2_record is None
                ):
                    result.wildcard_entry = True
                    result.wildcard_sibling = False

    except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
        result.wildcard_entry = False
    except Exception as e:
        logger.error(
            f"Unknown error checking for wildcard entry domain for {domain}: {e}"
        )
        result.wildcard_entry = False

    if result.wildcard_entry is False:
        # Check for wildcard sibling domains
        try:
            result.wildcard_sibling = False
            wildcard_sibling_domain = re.sub(r"^[^.]+", "*", domain)
            wildcard_record = dns.resolver.resolve(
                wildcard_sibling_domain,
                rdtype=dns.rdatatype.A,
                raise_on_no_answer=False,
            )
            if wildcard_record is not None:
                if a_records is None:
                    try:
                        # check for mail-only subdomain (e.g. mail.example.com)
                        mx_records = resolver.resolve(
                            qname=domain, rdtype=dns.rdatatype.MX
                        )
                        wildcard_mx = dns.resolver.resolve(
                            wildcard_sibling_domain,
                            rdtype=dns.rdatatype.MX,
                            raise_on_no_answer=False,
                        )
                        # if mx records exist and match, is wildcard sibling
                        if (
                            mx_records is None
                            or str(mx_records.response.answer[-1]).split(" ", 1)[1]
                            == str(wildcard_mx.response.answer[-1]).split(" ", 1)[1]
                        ):
                            result.wildcard_sibling = True
                    except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
                        pass
                # check to see if subdomain and wildcard record point to the same endpoints
                elif (
                    a_records.response.answer[-1] == wildcard_record.response.answer[-1]
                ):
                    result.wildcard_sibling = True

        except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
            result.wildcard_sibling = False
        except Exception as e:
            logger.error(
                f"Unknown error checking for wildcard sibling domain for {domain}: {e}"
            )
            result.wildcard_sibling = False

    return result


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
    dns_answer_return_types = []
    for query_type in [dns.rdatatype.SOA, dns.rdatatype.NS, dns.rdatatype.A]:
        rtype = get_dns_return_type(domain, query_type)
        if rtype == "NOERROR":
            dns_answer_return_types.append(rtype)
            break
        elif rtype is None:
            dns_answer_return_types.append(None)
            continue
        elif rtype == "NXDOMAIN":
            scan_result.rcode = rtype
            scan_result.record_exists = False
            return scan_result.__dict__
        elif rtype == "SERVFAIL":
            dns_answer_return_types.append(rtype)
        else:
            logger.error(
                f"Unknown return type '{rtype}' when checking if domain '{domain}' exists"
            )
            dns_answer_return_types.append(rtype)

    if "NOERROR" not in dns_answer_return_types:
        if "SERVFAIL" in dns_answer_return_types:
            scan_result.rcode = "SERVFAIL"
        elif [rtype for rtype in dns_answer_return_types if rtype is not None]:
            scan_result.rcode = [
                rtype for rtype in dns_answer_return_types if rtype is not None
            ][0]
        else:
            scan_result.rcode = None
        scan_result.record_exists = False
        return scan_result.__dict__

    scan_result.rcode = "NOERROR"
    scan_result.record_exists = True

    resolver = dns.resolver.Resolver()
    resolver.timeout = TIMEOUT
    resolver.lifetime = TIMEOUT * 2

    # Get chaining results (A and CNAME records)
    try:
        a_records = resolver.resolve(qname=domain, rdtype=dns.rdatatype.A)
    except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
        a_records = None
    except Exception as e:
        logger.error(f"Unknown error getting A records for {domain}: {e}")
        a_records = None

    if a_records:
        scan_result.resolve_ips = [a_record.to_text() for a_record in a_records]
        scan_result.resolve_chain = [
            str(answer).splitlines() for answer in a_records.response.answer
        ]
    else:
        scan_result.resolve_ips = None
        scan_result.resolve_chain = None

    # Get wildcard status of domain
    wildcard_status = get_wildcard_status(domain, resolver, a_records)
    scan_result.wildcard_entry = wildcard_status.wildcard_entry
    scan_result.wildcard_sibling = wildcard_status.wildcard_sibling

    # Get first CNAME record (in case there is no A record in chain). Checking if chain is valid.
    try:
        cname_record = resolver.resolve(qname=domain, rdtype=dns.rdatatype.CNAME)
    except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
        cname_record = None
        pass
    except Exception as e:
        logger.error(f"Unknown error getting CNAME record for {domain}: {e}")
        cname_record = None
        pass

    if cname_record is not None:
        scan_result.cname_record = str(cname_record.response.answer[0])

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

    # If no MX records are found (with warnings), but there are CNAME records, check the CNAME target for MX records
    if (
        len(scan_result.mx_records.get("hosts", [])) == 0
        and len(scan_result.mx_records.get("warnings", [])) > 0
        and scan_result.cname_record is not None
    ):
        cname_target_domain = scan_result.cname_record.split()[-1].strip(".")
        cname_scan_results = DMARCScanner(cname_target_domain).run()
        cname_mx_records = cname_scan_results.get("mx", {})

        if (
            len(cname_mx_records.get("hosts", [])) > 0
            and len(cname_mx_records.get("warnings", [])) == 0
        ):
            scan_result.mx_records = cname_mx_records

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
