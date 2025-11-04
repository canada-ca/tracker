import base64
import json
import logging
import os
import shutil
from collections import OrderedDict

import time

import dkim
import dns
import nacl
import tldextract
from checkdmarc import DNSException, check_ns, get_base_domain
from checkdmarc.dmarc import DMARCError, parse_dmarc_report_uri, check_dmarc
from checkdmarc.spf import SPFError, check_spf
from dkim import dnsplug, crypto, KeyFormatError, UnparsableKeyError
from dkim.util import InvalidTagValueList
import dns.resolver
from dns.exception import Timeout
from dns.resolver import NoAnswer, NXDOMAIN, NoNameservers

logger = logging.getLogger(__name__)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "20"))


def check_if_domain_exists(domain, resolver):
    if not resolver:
        resolver = dns.resolver.Resolver()
        resolver.timeout = TIMEOUT
        resolver.lifetime = TIMEOUT * 2

    # Check if domain exists, only return True if DNS returns NOERROR
    try:
        exist_response = resolver.resolve(
            domain, rdtype=dns.rdatatype.A, raise_on_no_answer=False
        )
        return exist_response.response.rcode() == dns.rcode.NOERROR
    except (NXDOMAIN, NoAnswer, NoNameservers, Timeout):
        return False
    except Exception as e:
        logger.error(f"Unknown error getting A record for {domain}: {e}")
        return False


def check_mx_records(
    domain: str, resolver: dns.resolver.Resolver = None, lifetime: float = 2.0
) -> OrderedDict:
    hosts = []
    warnings = []

    try:
        answers = resolver.resolve(domain, "MX")
        if not answers:
            warnings.append("No MX records found")
        for rdata in answers:
            if rdata.exchange.to_text() == ".":
                if rdata.preference != 0:
                    warnings.append(
                        f"Null MX record with non-zero preference {rdata.preference}"
                    )
                hosts.append(
                    OrderedDict(
                        [
                            ("preference", rdata.preference),
                            ("hostname", "."),
                            ("addresses", []),
                        ]
                    )
                )
                continue
            hostname = rdata.exchange.to_text().rstrip(".").lower()
            addresses = []
            try:
                a_answers = resolver.resolve(hostname, "A", lifetime=lifetime)
                addresses.extend([a.to_text() for a in a_answers])
            except dns.resolver.NoAnswer:
                pass
            try:
                aaaa_answers = resolver.resolve(hostname, "AAAA", lifetime=lifetime)
                addresses.extend([aaaa.to_text() for aaaa in aaaa_answers])
            except dns.resolver.NoAnswer:
                pass
            hosts.append(
                OrderedDict(
                    [
                        ("preference", rdata.preference),
                        ("hostname", hostname),
                        ("addresses", addresses),
                    ]
                )
            )
    except dns.resolver.NXDOMAIN:
        return OrderedDict(
            [("hosts", []), ("error", f"The domain {domain} does not exist")]
        )
    except dns.resolver.NoAnswer:
        return OrderedDict(
            [
                ("hosts", []),
                ("error", f"The domain {domain} does not have any MX records"),
            ]
        )
    except Exception as error:
        return OrderedDict([("hosts", []), ("error", str(error))])

    return OrderedDict([("hosts", hosts), ("warnings", warnings)])


class DMARCScanner:
    domain = None

    def __init__(self, target_domain):
        self.domain = target_domain

    @staticmethod
    def get_tld_extract():
        cache_dir = "/tmp/tldextract"

        try:
            cached_tld_extract_age_hours = (
                (time.time() - os.path.getmtime(cache_dir)) / 60 / 60
            )

            # If the cached tldextract is older than 24 hours, update it.
            if cached_tld_extract_age_hours > 24:
                logger.info(
                    f"Updating tldextract cache. (age: {cached_tld_extract_age_hours} hours)"
                )
                shutil.rmtree(cache_dir)
                extract = tldextract.TLDExtract(
                    include_psl_private_domains=True,
                    suffix_list_urls=[
                        "https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat"
                    ],
                    cache_dir=cache_dir,
                )
            else:
                # Otherwise, use the cached version.
                extract = tldextract.TLDExtract(
                    include_psl_private_domains=True,
                    suffix_list_urls=(),
                    cache_dir=cache_dir,
                )
        except FileNotFoundError:
            # If the cached tldextract does not exist, create it.
            logger.info("Creating tldextract cache.")
            extract = tldextract.TLDExtract(
                include_psl_private_domains=True,
                suffix_list_urls=[
                    "https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat"
                ],
                cache_dir=cache_dir,
            )

        return extract

    def run(self):

        # Single-item list to pass off to check_domains function.
        domain_list = list()
        domain_list.append(self.domain)

        resolver = dns.resolver.Resolver()
        resolver.timeout = TIMEOUT
        lifetime = TIMEOUT * 2
        resolver.lifetime = lifetime

        try:
            # Perform "checkdmarc" scan on provided domain.
            scan_result = json.loads(
                json.dumps(
                    {
                        "domain": self.domain,
                        "base_domain": get_base_domain(self.domain),
                        "ns": check_ns(self.domain, resolver=resolver, timeout=TIMEOUT),
                        "mx": check_mx_records(
                            self.domain, resolver=resolver, lifetime=lifetime
                        ),
                        "spf": check_spf(
                            self.domain, resolver=resolver, timeout=TIMEOUT
                        ),
                        "dmarc": check_dmarc(
                            self.domain,
                            ignore_unrelated_records=True,
                            resolver=resolver,
                            timeout=TIMEOUT,
                        ),
                    }
                )
            )

        except (DNSException, SPFError, DMARCError) as e:
            logger.error(
                f"Failed to check the given domains for DMARC/SPF records. ({e})"
            )
            return {
                "dmarc": {
                    "error": f"Failed to check the given domains for records: {self.domain}"
                },
                "spf": {
                    "error": f"Failed to check the given domains for records: {self.domain}"
                },
                "mx": {
                    "error": f"Failed to check the given domains for records: {self.domain}"
                },
            }

        effective_policy_source = None
        effective_policy = None

        p_policy = scan_result["dmarc"].get("tags", {}).get("p", {}).get("value", None)
        sp_policy = (
            scan_result["dmarc"].get("tags", {}).get("sp", {}).get("value", None)
        )

        if p_policy and sp_policy:
            if self.domain == scan_result.get("dmarc", {}).get("location", ""):
                effective_policy_source = "p"
                effective_policy = p_policy
            else:
                effective_policy_source = "sp"
                effective_policy = sp_policy

        scan_result["dmarc"]["effective_policy_source"] = effective_policy_source
        scan_result["dmarc"]["effective_policy"] = effective_policy

        def fix_spf_recursive_record_data(spf_res):
            parsed_spf = spf_res.get("parsed", {})

            include = [
                fix_spf_recursive_record_data(spf_include)
                for spf_include in parsed_spf.get("include", [])
            ]
            spf_res["parsed"]["include"] = include

            redirect = (
                fix_spf_recursive_record_data(parsed_spf.get("redirect"))
                if parsed_spf.get("redirect")
                else None
            )
            spf_res["parsed"]["redirect"] = redirect

            if redirect:
                # Follow "redirect" modifier for "all" mechanism
                logger.debug(
                    f'Following redirect in SPF record for "all" mechanism: {self.domain}'
                )
                spf_res["spf_default"] = redirect.get("spf_default", None)
            else:
                spf_res["spf_default"] = parsed_spf.get("all", None)

            spf_res["parsed"].pop("all", None)

            spf_res["lookups"] = spf_res["dns_lookups"]
            spf_res.pop("dns_lookups", None)

            duplicate_include = [
                warning.split(":")[1].strip()
                for warning in spf_res.get("warnings", [])
                if warning.startswith("Duplicate include")
            ]
            spf_res["parsed"]["duplicate_include"] = duplicate_include

            return spf_res

        if scan_result["spf"].get("record", None) and not scan_result["spf"].get(
            "error", None
        ):
            fix_spf_recursive_record_data(scan_result["spf"])

        if scan_result["dmarc"].get("record", "null") == "null":
            return {
                "dmarc": {"error": "missing"},
                "spf": {"error": "missing"},
                "mx": {"error": "missing"},
            }

        # check_domains function does not always return an array for values in rua, account for this
        if isinstance(
            scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []), str
        ):
            uris = (
                scan_result["dmarc"]
                .get("tags", {})
                .get("rua", {})
                .get("value", [])
                .split(",")
            )
            parsed_uris = [parse_dmarc_report_uri(uri) for uri in uris]
            scan_result["dmarc"].get("tags", {}).get("rua", {})["value"] = parsed_uris

        for rua_value in (
            scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", [])
        ):
            try:
                # Retrieve 'rua' tag address.
                rua_addr = rua_value["address"]

                # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
                rua_domain = rua_addr.split("@", 1)[1]

                # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
                extract = self.get_tld_extract()
                parsed_domain = extract(self.domain)
                org_domain = ".".join([parsed_domain.domain, parsed_domain.suffix])

                # Extract organizational domain from 'rua' domain
                parsed_rua_domain = extract(rua_domain)
                rua_org_domain = ".".join(
                    [parsed_rua_domain.domain, parsed_rua_domain.suffix]
                )

                # If the report destination's organizational does not differ from the provided domain's
                # organizational domain, assert reports are being accepted.
                if rua_org_domain == org_domain:
                    rua_value["accepting"] = True
                else:
                    try:
                        # Request txt record to ensure that "rua" domain accepts DMARC reports.
                        rua_scan_result = resolver.resolve(
                            f"{self.domain}._report._dmarc.{rua_domain}", "TXT"
                        )
                        rua_txt_value = (
                            rua_scan_result.response.answer[0][0]
                            .strings[0]
                            .decode("UTF-8")
                        )
                        # Assert external reporting arrangement has been authorized if TXT containing version tag
                        # with value "DMARC1" is found.
                        rua_value["accepting"] = (
                            rua_txt_value.strip().replace(";", "") == "v=DMARC1"
                        )
                    except (
                        DNSException,
                        SPFError,
                        DMARCError,
                        dns.resolver.NXDOMAIN,
                        NoAnswer,
                    ) as e:
                        logger.error(
                            f"Failed to validate external reporting arrangement between rua address={rua_domain} and domain={self.domain}: {e}"
                        )
                        rua_value["accepting"] = "undetermined"

            except (TypeError, KeyError) as e:
                logger.error(
                    f"Error `{e}` while validating rua for domain: {self.domain}. scan_result: {json.dumps(scan_result, indent=2)}"
                )

        # check_domains function does not always return an array for values in ruf, account for this
        if isinstance(
            scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []), str
        ):
            uris = (
                scan_result["dmarc"]
                .get("tags", {})
                .get("ruf", {})
                .get("value", [])
                .split(",")
            )
            parsed_uris = [parse_dmarc_report_uri(uri) for uri in uris]
            scan_result["dmarc"].get("tags", {}).get("ruf", {})["value"] = parsed_uris

        for ruf in scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []):
            try:
                # Retrieve 'ruf' tag address.
                ruf_addr = ruf["address"]

                # Extract the domain from the address string (e.g. 'dmarc@cyber.gc.ca' -> 'cyber.gc.ca').
                ruf_domain = ruf_addr.split("@", 1)[1]

                # Extract organizational domain from original domain (e.g. 'tracker.cyber.gc.ca' -> 'cyber.gc.ca')
                extract = self.get_tld_extract()
                parsed_domain = extract(self.domain)
                org_domain = ".".join([parsed_domain.domain, parsed_domain.suffix])

                # Extract organizational domain from 'ruf' domain
                parsed_ruf_domain = extract(ruf_domain)
                ruf_org_domain = ".".join(
                    [parsed_ruf_domain.domain, parsed_ruf_domain.suffix]
                )

                # If the report destination's organizational does not differ from the provided domain's
                # organizational domain, assert reports are being accepted.
                if ruf_org_domain == org_domain:
                    ruf["accepting"] = True
                else:
                    try:
                        # Request txt record to ensure that "ruf" domain accepts DMARC reports.
                        ruf_scan_result = resolver.resolve(
                            f"{self.domain}._report._dmarc.{ruf_domain}", "TXT"
                        )
                        ruf_txt_value = (
                            ruf_scan_result.response.answer[0][0]
                            .strings[0]
                            .decode("UTF-8")
                        )
                        # Assert external reporting arrangement has been authorized if TXT containing version tag
                        # with value "DMARC1" is found.
                        ruf["accepting"] = (
                            ruf_txt_value.strip().replace(";", "") == "v=DMARC1"
                        )
                    except (
                        DNSException,
                        SPFError,
                        DMARCError,
                        dns.resolver.NXDOMAIN,
                        NoAnswer,
                    ) as e:
                        logger.error(
                            f"Failed to validate external reporting arrangement between ruf address={ruf_domain} and domain={self.domain}: {e}"
                        )
                        ruf["accepting"] = "undetermined"
            except (TypeError, KeyError) as e:
                logger.error(
                    f"Error occurred while attempting to validate ruf address for domain={self.domain}: {e}"
                )

        return scan_result


class DKIMScanner:
    domain = None
    selectors = None

    def __init__(self, target_domain, selectors):
        self.domain = target_domain
        self.selectors = selectors

    @staticmethod
    def bitsize(x):
        """Return size of long in bits."""
        return len(bin(x)) - 2

    @staticmethod
    def load_pk(name, s=None):
        """
        Load the corresponding public key from DNS records
        :param name: Domain name
        :param s: TXT record from DNS
        :return: tuple (pk, keysize, ktag)
            WHERE
            pk: public key value
            keysize: size of public key
            ktag: key type (RSA, etc.)
        """
        if not s:
            raise KeyFormatError("missing public key: %s" % name)
        try:
            if type(s) is str:
                s = s.encode("ascii")
            pub = dkim.util.parse_tag_value(s)
        except InvalidTagValueList as e:
            raise KeyFormatError(e)

        if pub.get(b"p") == b"":
            return None, None, None

        pk = None
        keysize = None
        ktag = pub.get(b"k", b"rsa")

        if ktag == b"ed25519":
            pk = nacl.signing.VerifyKey(pub[b"p"], encoder=nacl.encoding.Base64Encoder)
            keysize = 256

        if ktag == b"rsa":
            try:
                pk = crypto.parse_public_key(base64.b64decode(pub[b"p"]))
                keysize = dkim.bitsize(pk["modulus"])
            except KeyError:
                raise KeyFormatError(f"incomplete public key: {s}")
            except (TypeError, UnparsableKeyError) as e:
                raise KeyFormatError(f"could not parse public key ({pub[b'p']}): {e}")

        return pk, keysize, ktag

    def run(self):

        record = {}

        for selector in self.selectors:
            record[selector] = {}
            try:
                # Add period at end of name for DNS query, otherwise it may not resolve in containers due to search
                # in /etc/resolv.conf
                lookup_url = f"{selector}._domainkey.{self.domain}."
                # Retrieve public key from DNS
                txt_record_bytes = dnsplug.get_txt_dnspython(lookup_url)
                dkim_txt_values_bytes = dkim.util.parse_tag_value(txt_record_bytes)

                parsed_txt_record = {}

                for key, val in dkim_txt_values_bytes.items():
                    parsed_txt_record[key.decode("ascii")] = val.decode("ascii")

                pk, keysize, ktag = self.load_pk(lookup_url, txt_record_bytes)
                ktag = ktag.decode("ascii") if ktag else None

                if pk and pk.get("publicExponent"):
                    public_exponent = pk.get("publicExponent")
                else:
                    public_exponent = None

                if pk and pk.get("modulus"):
                    modulus = pk.get("modulus")
                else:
                    modulus = None

                record[selector]["record"] = txt_record_bytes.decode("ascii")
                record[selector]["parsed"] = parsed_txt_record
                record[selector]["key_size"] = keysize
                record[selector]["key_type"] = ktag
                record[selector]["public_key_modulus"] = modulus
                record[selector]["public_exponent"] = public_exponent

            except Exception as e:
                logger.error(
                    f"Failed to perform DomainKeys Identified Mail scan on given domain: {self.domain}, (selector: {selector}): {str(e)}"
                )
                record[selector] = {"error": "missing"}

        return record
