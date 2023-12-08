import base64
import logging
import os
import json
import time
import shutil

import dkim
import dns
import nacl
import tldextract
from checkdmarc import check_domains, DNSException, SPFError, DMARCError, \
    parse_dmarc_report_uri
from dkim import dnsplug, crypto, KeyFormatError, UnparsableKeyError
from dkim.util import InvalidTagValueList
from dns import resolver
from dns.exception import Timeout
from dns.resolver import NoAnswer, NXDOMAIN, NoNameservers

logger = logging.getLogger(__name__)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "80"))


def check_if_domain_exists(domain):
    # Check if domain exists, only return True if DNS returns NOERROR
    try:
        exist_response = dns.resolver.resolve(domain, rdtype=dns.rdatatype.A, raise_on_no_answer=False)
        return exist_response.response.rcode() == dns.rcode.NOERROR
    except (NXDOMAIN, NoAnswer, NoNameservers, Timeout):
        return False
    except Exception as e:
        logger.error(f"Unknown error getting A record for {domain}: {e}")
        return False
    except DNSException as e:
        logging.error(f"DNSException occurred while checking if domain exists: {e}")
        return False
    except NoNameservers as e:
        logging.error(f"NoNameservers occurred while checking if domain exists: {e}")
        return False
    except BaseException as e:
        logging.error(f"Unknown error occurred while checking if domain exists: {e}")
        return False


class DMARCScanner:
    domain = None

    def __init__(self, target_domain):
        self.domain = target_domain

    @staticmethod
    def get_tld_extract():
        cache_dir = '/tmp/tldextract'

        try:
            cached_tld_extract_age_hours = (time.time() - os.path.getmtime(cache_dir)) / 60 / 60

            # If the cached tldextract is older than 24 hours, update it.
            if cached_tld_extract_age_hours > 24:
                logger.info(f"Updating tldextract cache. (age: {cached_tld_extract_age_hours} hours)")
                shutil.rmtree(cache_dir)
                extract = tldextract.TLDExtract(include_psl_private_domains=True, suffix_list_urls=['https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat'], cache_dir=cache_dir)
            else:
                # Otherwise, use the cached version.
                extract = tldextract.TLDExtract(include_psl_private_domains=True, suffix_list_urls=(), cache_dir=cache_dir)
        except FileNotFoundError:
            # If the cached tldextract does not exist, create it.
            logger.info("Creating tldextract cache.")
            extract = tldextract.TLDExtract(include_psl_private_domains=True, suffix_list_urls=['https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat'], cache_dir=cache_dir)

        return extract

    def run(self):

        # Single-item list to pass off to check_domains function.
        domain_list = list()
        domain_list.append(self.domain)

        try:
            # Perform "checkdmarc" scan on provided domain.
            scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True, timeout=5.0)))
        except (DNSException, SPFError, DMARCError) as e:
            logging.error(f"Failed to check the given domains for DMARC/SPF records. ({e})")
            return {
                "dmarc": {"error": f"Failed to check the given domains for records: {self.domain}"},
                "spf": {"error": f"Failed to check the given domains for records: {self.domain}"},
                "mx": {"error": f"Failed to check the given domains for records: {self.domain}"},
            }

        if scan_result["dmarc"].get("record", "null") == "null":
            return {
                "dmarc": {"error": "missing"},
                "spf": {"error": "missing"},
                "mx": {"error": "missing"},
            }

        # check_domains function does not always return an array for values in rua, account for this
        if isinstance(scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []), str):
            uris = scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []).split(',')
            parsed_uris = [parse_dmarc_report_uri(uri) for uri in uris]
            scan_result["dmarc"].get("tags", {}).get("rua", {})["value"] = parsed_uris

        for rua_value in scan_result["dmarc"].get("tags", {}).get("rua", {}).get("value", []):
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
                rua_org_domain = ".".join([parsed_rua_domain.domain, parsed_rua_domain.suffix])

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
                            rua_scan_result.response.answer[0][0].strings[0].decode("UTF-8")
                        )
                        # Assert external reporting arrangement has been authorized if TXT containing version tag
                        # with value "DMARC1" is found.
                        scan_result["dmarc"]["tags"]["rua"]["accepting"] = (
                            rua_txt_value == "v=DMARC1"
                        )
                    except (DNSException, SPFError, DMARCError, resolver.NXDOMAIN, NoAnswer) as e:
                        logging.error(
                            f"Failed to validate external reporting arrangement between rua address={rua_domain} and domain={self.domain}: {e}")
                        rua_value["accepting"] = "undetermined"
            except (TypeError, KeyError) as e:
                logging.error(
                    f"Error `{e}` while validating rua for domain: {self.domain}. scan_result: {json.dumps(scan_result, indent=2)}")

        # check_domains function does not always return an array for values in ruf, account for this
        if isinstance(scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []), str):
            uris = scan_result["dmarc"].get("tags", {}).get("ruf", {}).get("value", []).split(',')
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
                ruf_org_domain = ".".join([parsed_ruf_domain.domain, parsed_ruf_domain.suffix])

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
                            ruf_scan_result.response.answer[0][0].strings[0].decode("UTF-8")
                        )
                        # Assert external reporting arrangement has been authorized if TXT containing version tag
                        # with value "DMARC1" is found.
                        scan_result["dmarc"]["tags"]["ruf"]["accepting"] = (
                            ruf_txt_value == "v=DMARC1"
                        )
                    except (DNSException, SPFError, DMARCError, resolver.NXDOMAIN, NoAnswer) as e:
                        logging.error(
                            f"Failed to validate external reporting arrangement between ruf address={ruf_domain} and domain={self.domain}: {e}")
                        ruf["accepting"] = "undetermined"
            except (TypeError, KeyError) as e:
                logging.error(f"Error occurred while attempting to validate ruf address for domain={self.domain}: {e}")

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
                logging.error(
                    f"Failed to perform DomainKeys Identified Mail scan on given domain: {self.domain}, (selector: {selector}): {str(e)}"
                )
                record[selector] = {"error": "missing"}

        return record
