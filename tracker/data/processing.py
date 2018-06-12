###
#
# Given, in the data/output/parents/results directory:
#
# * pshtt.csv - domain-scan, based on pshtt
# * sslyze.csv - domain-scan, based on sslyze.
#
# And, in the data/output/subdomains directory:
#
# * gather/results/gathered.csv - all gathered .gov hostnames
# * scan/results/pshtt.csv - pshtt scan for all hostnames
# * scan/results/sslyze.csv - sslyze scan for live/TLS hostnames
#
###

import errno
import csv
import datetime
import logging
import pathlib
import os
import re
import subprocess
import typing
from shutil import copyfile
import slugify

# Import all the constants from data/env.py.
from data import env
from data import logger
from data import models


LOGGER = logger.get_logger(__name__)

# domains.csv is downloaded and live-cached during the scan
SCAN_CACHE = os.path.join(env.SCAN_DATA, "cache")
SCAN_DOMAINS_CSV = os.path.join(SCAN_CACHE, "domains.csv")

###
# Main task flow.

# Read in data from domains.csv, and scan data from domain-scan.
# All database operations are made in the run() method.
#
# This method blows away the database and rebuilds it from the given data.
def run(date: typing.Optional[str], connection_string: str):
    if date is None:
        date = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d")

    # Read in domains and organizations from domains.csv.
    # Returns dicts of values ready for saving as Domain and Agency objects.
    #
    # Also returns gathered subdomains, which need more filtering to be useful.
    domains, domain_map = load_domain_data()
    acceptable_ciphers = load_compliance_data()

    # Read in domain-scan CSV data.
    scan_data = load_scan_data(domains)

    # Capture manual exclusions and pull out some high-level data from pshtt.
    for domain_name in scan_data:
        # Pull out a few pshtt.csv fields as general domain-level metadata.
        pshtt = scan_data[domain_name].get("pshtt", None)
        if pshtt is None:
            # generally means scan was on different domains.csv, but
            # invalid domains can hit this.
            LOGGER.warning("[%s] No pshtt data for domain!", domain_name)

            # Remove the domain from further consideration.
            # Destructive, so have this done last.
            del domain_map[domain_name]
        elif domain_name in domain_map:
            # LOGGER.info("[%s] Updating with pshtt metadata." % domain_name)
            domain_map[domain_name]["live"] = boolean_for(pshtt["Live"])
            domain_map[domain_name]["redirect"] = boolean_for(pshtt["Redirect"])
            domain_map[domain_name]["canonical"] = pshtt["Canonical URL"]
        elif boolean_for(pshtt['Live']):
            domain_map[domain_name] = {
                "domain": domain_name,
                "is_owner": False,
                "sources": ["canada-gov"],
                "live": True,
                "redirect": boolean_for(pshtt["Redirect"]),
                "canonical": pshtt["Canonical URL"],
                "exclude": {},
            }

    map_subdomains(scan_data, domain_map)
    organizations = extract_orgs(domain_map)

    # Save what we've got to the database so far.
    sorted_domains = list(domain_map.keys())
    sorted_domains.sort()
    sorted_organizations = list(organizations.keys())
    sorted_organizations.sort()

    # Calculate high-level per-domain conclusions for each report.
    # Overwrites `domains` and `subdomains` in-place.
    process_domains(
        domain_map, scan_data, acceptable_ciphers
    )

    # Reset the database.
    LOGGER.info("Clearing the database.")
    with models.Connection(connection_string) as connection:
        connection.domains.clear()
        connection.reports.clear()
        connection.organizations.clear()

        # Calculate organization-level summaries. Updates `organizations` in-place.
        update_organization_totals(organizations, domain_map)

        # Calculate government-wide summaries.
        report = full_report(domain_map)
        report["report_date"] = date

        LOGGER.info("Creating all domains.")
        connection.domains.create_all(domain_map[domain_name] for domain_name in sorted_domains)
        LOGGER.info("Creating all organizations.")
        connection.organizations.create_all(
            organizations[organization_name] for organization_name in sorted_organizations
        )

        # Create top-level summaries.
        LOGGER.info("Creating government-wide totals.")
        connection.reports.create(report)

    # Print and exit
    print_report(report)


def cache_file(uri: str) -> pathlib.Path:
    LOGGER.info("caching %s", uri)
    mkdir_p(SCAN_CACHE)
    path = pathlib.Path(uri)
    cache_location = pathlib.Path(SCAN_CACHE) / path.name
    if cache_location.is_file():
        return cache_location

    if uri.startswith("http:") or uri.startswith("https:"):
        shell_out(["wget", uri, "-O", os.path.join(SCAN_CACHE, path.name)])
    else:
        copyfile(uri, str(cache_location))
    return cache_location


def in_cache(path: str) -> bool:
    cache_path = pathlib.Path(SCAN_CACHE) / pathlib.Path(path).name
    return cache_path.exists()


def _load_data(path: pathlib.Path) -> typing.Set[str]:
    data = set()
    with path.open('r', encoding='utf-8-sig', newline='') as cipherfile:
        reader = csv.reader(cipherfile)
        next(reader) # assume csv has header column
        for row in reader:
            try:
                data.add(row[0])
            except IndexError:
                # csv had an empty row, not really a big deal
                continue
    return data


def load_compliance_data() -> typing.Set[str]:
    return _load_data(cache_file(env.CIPHER))


# Reads in input CSVs (domain list).
def load_domain_data() -> typing.Tuple[typing.Set, typing.Dict]:

    domain_map: typing.Dict = {}
    domains: typing.Set[str] = set()

    # if domains.csv wasn't cached, download it anew
    if not os.path.exists(SCAN_DOMAINS_CSV):
        cache_file(env.DOMAINS)

    owner_path = cache_file(env.OWNERSHIP)

    if not os.path.exists(SCAN_DOMAINS_CSV):
        LOGGER.critical("Couldn't download domains.csv")
        exit(1)

    with owner_path.open('r', encoding='utf-8-sig', newline='') as csvfile:
        for row in csv.reader(csvfile):
            if row[0].lower().startswith("domain"):
                continue

            domain_name = row[0].lower().strip()
            organization_name_en = row[2].strip()
            organization_name_fr = row[3].strip()
            organization_slug = slugify.slugify(organization_name_en)

            if domain_name not in domain_map:
                # By assuming the domain name is the base domain if it appears
                # in current-federal.csv, we automatically treat fed.us domains
                # as base domains, without explicitly incorporating the Public
                # Suffix List.
                #
                # And since we excluded "fed.us" itself above, this should
                # cover all the bases.
                domain_map[domain_name] = {
                    "domain": domain_name,
                    "base_domain": domain_name,
                    "organization_name_en": organization_name_en,
                    "organization_name_fr": organization_name_fr,
                    "organization_slug": organization_slug,
                    "sources": ["canada-gov"],
                    "is_parent": True,
                    "is_owner": True,
                    "exclude": {},
                }

    with open(SCAN_DOMAINS_CSV, newline="") as csvfile:
        for row in csv.reader(csvfile):
            if row[0].lower().startswith("domain"):
                continue

            domain = row[0].lower().strip()
            domains.add(domain)


    return domains, domain_map


def extract_orgs(domain_map: typing.Dict) -> typing.Dict:
    organization_map: typing.Dict = {}
    for doc in domain_map.values():
        slug = doc['organization_slug']
        if slug in organization_map:
            organization_map[slug]['total_domains'] += 1
        else:
            organization_map[slug] = {
                "name_en": doc['organization_name_en'],
                "name_fr": doc['organization_name_fr'],
                "slug": slug,
                "total_domains": 1,
            }
    return organization_map

# Load in data from the CSVs produced by domain-scan.
# The 'domains' map is used to ignore any untracked domains.
def load_scan_data(domains: typing.Set[str]) -> typing.Dict:
    parent_scan_data: typing.Dict = {}
    for domain_name in domains:
        parent_scan_data[domain_name] = {}

    with open(os.path.join(env.SCAN_RESULTS, "pshtt.csv"), newline="") as csvfile:
        for row in csv.DictReader(csvfile):
            domain = row['Domain'].lower()
            if domain not in domains:
                LOGGER.info("[pshtt] Skipping pshtt data for %s, not in domains.csv.", domain)
                continue

            parent_scan_data[domain]["pshtt"] = row

    with open(os.path.join(env.SCAN_RESULTS, "sslyze.csv"), newline="") as csvfile:
        for row in csv.DictReader(csvfile):
            domain = row['Domain'].lower()
            if domain not in domains:
                LOGGER.info("[sslyze] Skipping sslyze data for %s, not in domains.csv.", domain)
                continue

            # If the scan was invalid, most fields will be empty strings.
            # It'd be nice to make this more semantic on the domain-scan side.
            if row["SSLv2"] == "":
                LOGGER.info("[sslyze] Skipping sslyze data for %s, scan data was invalid.", domain)
                continue

            parent_scan_data[domain]["sslyze"] = row

    return parent_scan_data


def map_subdomains(scan_data, domain_map):
    for domain in scan_data:
        if boolean_for(scan_data[domain]['pshtt']["Live"]) and not domain_map[domain]["is_owner"]:
            parts = domain.split('.')
            subdomain = domain
            while parts and (subdomain not in domain_map or not domain_map[subdomain]["is_owner"]):
                parts = parts[1:]
                subdomain = '.'.join(parts)

            if not parts:
                domain_map[domain].update({
                    "base_domain": domain,
                    "is_parent": True,
                    "organization_name_en": 'Government of Canada',
                    "organization_name_fr": 'Gouvernement du Canada',
                    "organization_slug": 'government-of-canada',
                })
                continue

            parent = '.'.join(parts)
            if scan_data[parent].get("subdomains") is None:
                scan_data[parent]["subdomains"] = []
            scan_data[parent]["subdomains"].append(domain)
            domain_map[domain].update({
                "base_domain": parent,
                "is_parent": False,
                "organization_slug": domain_map[parent]["organization_slug"],
                "organization_name_en": domain_map[parent]["organization_name_en"],
                "organization_name_fr": domain_map[parent]["organization_name_fr"],
            })


# Given the domain data loaded in from CSVs, draw conclusions,
# and filter/transform data into form needed for display.
def process_domains(domains, scan_data, acceptable_ciphers):
    # For each domain, determine eligibility and, if eligible,
    # use the scan data to draw conclusions.
    for domain_name in domains.keys():

        ### HTTPS
        #
        # For HTTPS, we calculate individual reports for every subdomain.

        https_parent = {
            "eligible": False,  # domain eligible itself (is it live?)
            "eligible_zone": False,  # zone eligible (itself or any live subdomains?)
        }
        eligible_children = []

        # No matter what, put the preloaded state onto the parent,
        # since even an unused domain can always be preloaded.
        https_parent["preloaded"] = preloaded_or_not(
            scan_data[domain_name]["pshtt"]
        )

        # Tally subdomains first, so we know if the parent zone is
        # definitely eligible as a zone even if not as a website
        for subdomain_name in scan_data[domain_name].get("subdomains", []):

            if eligible_for_https(domains[subdomain_name]):
                eligible_children.append(subdomain_name)
                domains[subdomain_name]["https"] = https_behavior_for(
                    scan_data[subdomain_name]["pshtt"],
                    scan_data[subdomain_name].get("sslyze", None),
                    acceptable_ciphers,
                    parent_preloaded=https_parent["preloaded"],
                )

        # ** syntax merges dicts, available in 3.5+
        if eligible_for_https(domains[domain_name]):
            https_parent = {
                **https_parent,
                **https_behavior_for(
                    scan_data[domain_name]["pshtt"],
                    scan_data[domain_name].get("sslyze", None),
                    acceptable_ciphers,
                ),
            }
            https_parent["eligible_zone"] = True

        # even if not eligible directly, can be eligible via subdomains
        elif eligible_children:
            https_parent["eligible_zone"] = True

        # If the parent zone is preloaded, make sure that each subdomain
        # is considered to have HSTS in place. If HSTS is yes on its own,
        # leave it, but if not, then grant it the minimum level.
        # TODO:

        domains[domain_name]["https"] = https_parent

        # Totals based on summing up eligible reports within this domain.
        totals = {}

        # For HTTPS/HSTS, pshtt-eligible parent + subdomains.
        eligible_reports = [domains[name]["https"] for name in eligible_children]
        if https_parent["eligible"]:
            eligible_reports = [https_parent] + eligible_reports
        totals["https"] = total_https_report(eligible_reports)

        # For SSLv2/SSLv3/RC4/3DES, sslyze-eligible parent + subdomains.
        subdomain_names = scan_data[domain_name].get("subdomains", [])
        eligible_reports = [
            domains[name]["https"]
            for name in subdomain_names
            if domains[name].get("https")
            and domains[name]["https"].get("rc4") is not None
        ]
        if https_parent and https_parent.get("rc4") is not None:
            eligible_reports = [https_parent] + eligible_reports
        totals["crypto"] = total_crypto_report(eligible_reports)

        domains[domain_name]["totals"] = totals


# Given a list of domains or subdomains, quick filter to which
# are eligible for this report, optionally for an organization.
def eligible_for(report, hosts, organization=None):
    return [
        host[report]
        for hostname, host in hosts.items()
        if (
            host.get(report)
            and host[report]["eligible"]
            and ((organization is None) or (host["organization_slug"] == organization["slug"]))
        )
    ]


# Go through each report type and add organization totals for each type.
def update_organization_totals(organizations, domains):

    # For each organization, update their report counts for every domain they have.
    for organization_slug in organizations.keys():
        organization = organizations[organization_slug]

        # HTTPS. Parent and subdomains.
        # LOGGER.info("[%s][%s] Totalling report." % (organization['slug'], 'https'))
        eligible = eligible_for("https", domains, organization)
        organization["https"] = total_https_report(eligible)

        # Separate report for crypto, for sslyze-scanned domains.
        # LOGGER.info("[%s][%s] Totalling report." % (organization['slug'], 'crypto'))
        eligible = [
            domain["https"]
            for name, domain in domains.items()
            if (domain["organization_slug"] == organization["slug"])
            and domain.get("https")
            and (domain["https"].get("rc4") is not None)
        ]
        organization["crypto"] = total_crypto_report(eligible)

        # Special separate report for preloaded parent domains.
        # All parent domains, whether they use HTTP or not, are eligible.
        # LOGGER.info("[%s][%s] Totalling report." % (organization['slug'], 'preloading'))
        eligible = [
            host["https"]
            for hostname, host in domains.items()
            if host["organization_slug"] == organization_slug
        ]
        organization["preloading"] = total_preloading_report(eligible)


# Create a Report about each tracked stat.
def full_report(domains):

    full = {}

    # HTTPS. Parent and subdomains.
    LOGGER.info("[https] Totalling full report.")
    eligible = eligible_for("https", domains)
    full["https"] = total_https_report(eligible)

    LOGGER.info("[crypto] Totalling full report.")
    eligible = [
        domain["https"]
        for name, domain in domains.items()
        if domain.get("https") and (domain["https"].get("rc4") is not None)
    ]
    full["crypto"] = total_crypto_report(eligible)

    # Special separate report for preloaded parent domains.
    # All parent domains, whether they use HTTP or not, are eligible.
    LOGGER.info("[preloading] Totalling full report.")
    eligible = [host["https"] for hostname, host in domains.items()]
    full["preloading"] = total_preloading_report(eligible)

    return full

def eligible_for_https(domain):
    return domain["live"] is True


# Given a pshtt report and (optional) sslyze report,
# fill in a dict with the conclusions.
def https_behavior_for(pshtt, sslyze, accepted_ciphers, parent_preloaded=None):
    report = {"eligible": True}

    # assumes that HTTPS would be technically present, with or without issues
    if boolean_for(pshtt["Downgrades HTTPS"]):
        https = 0  # No
    else:
        if boolean_for(pshtt["Valid HTTPS"]):
            https = 2  # Yes
        elif (
                boolean_for(pshtt["HTTPS Bad Chain"])
                and not boolean_for(pshtt["HTTPS Bad Hostname"])
        ):
            https = 1  # Yes
        else:
            https = -1  # No

    report["uses"] = https

    ###
    # Is HTTPS enforced?

    if https <= 0:
        behavior = 0  # N/A

    else:

        # "Yes (Strict)" means HTTP immediately redirects to HTTPS,
        # *and* that HTTP eventually redirects to HTTPS.
        #
        # Since a pure redirector domain can't "default" to HTTPS
        # for itself, we'll say it "Enforces HTTPS" if it immediately
        # redirects to an HTTPS URL.
        if (
                boolean_for(pshtt["Strictly Forces HTTPS"])
                and (
                    boolean_for(pshtt["Defaults to HTTPS"]) or boolean_for(pshtt["Redirect"])
                )
        ):
            behavior = 3  # Yes (Strict)

        # "Yes" means HTTP eventually redirects to HTTPS.
        elif (
                not boolean_for(pshtt["Strictly Forces HTTPS"])
                and boolean_for(pshtt["Defaults to HTTPS"])
        ):
            behavior = 2  # Yes

        # Either both are False, or just 'Strict Force' is True,
        # which doesn't matter on its own.
        # A "present" is better than a downgrade.
        else:
            behavior = 1  # Present (considered 'No')

    report["enforces"] = behavior

    ###
    # Characterize the presence and completeness of HSTS.

    if pshtt["HSTS Max Age"]:
        hsts_age = int(pshtt["HSTS Max Age"])
    else:
        hsts_age = None

    # If this is a subdomain, it can be considered as having HSTS, via
    # the preloading of its parent.
    if parent_preloaded:
        hsts = 3  # Yes, via preloading

    # Otherwise, without HTTPS there can be no HSTS for the domain directly.
    elif https <= 0:
        hsts = -1  # N/A (considered 'No')

    else:

        # HSTS is present for the canonical endpoint.
        if boolean_for(pshtt["HSTS"]) and hsts_age:

            # Say No for too-short max-age's, and note in the extended details.
            if hsts_age >= 31536000:
                hsts = 2  # Yes, directly
            else:
                hsts = 1  # No
        else:
            hsts = 0  # No

    # Separate preload status from HSTS status:
    #
    # * Domains can be preloaded through manual overrides.
    # * Confusing to mix an endpoint-level decision with a domain-level decision.
    if boolean_for(pshtt["HSTS Preloaded"]):
        preloaded = 2  # Yes
    elif boolean_for(pshtt["HSTS Preload Ready"]):
        preloaded = 1  # Ready for submission
    else:
        preloaded = 0  # No

    report["hsts"] = hsts
    report["hsts_age"] = hsts_age
    report["preloaded"] = preloaded

    ###
    # Get cipher/protocol data via sslyze for a host.

    sslv2 = None
    sslv3 = None
    any_rc4 = None
    any_3des = None
    bad_ciphers = []
    acceptable_ciphers = None
    signature_algorithm = None
    good_cert = None
    tlsv10 = None
    tlsv11 = None

    # values: unknown or N/A (-1), No (0), Yes (1)
    bod_crypto = None

    # N/A if no HTTPS
    if report["uses"] <= 0:
        bod_crypto = -1  # N/A

    elif sslyze is None:
        # LOGGER.info("[https][%s] No sslyze scan data found." % name)
        bod_crypto = -1  # Unknown

    else:
        ###
        # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
        any_rc4 = boolean_for(sslyze["Any RC4"])
        # TODO: kill conditional once everything is synced
        if sslyze.get("Any 3DES"):
            any_3des = boolean_for(sslyze["Any 3DES"])
        sslv2 = boolean_for(sslyze["SSLv2"])
        sslv3 = boolean_for(sslyze["SSLv3"])

        ###
        # ITPIN cares about usage of TLS 1.0 and TLS 1.1
        tlsv10 = boolean_for(sslyze["TLSv1.0"])
        tlsv11 = boolean_for(sslyze["TLSv1.1"])

        used_ciphers = {cipher for cipher in sslyze.get("Accepted Ciphers").split(', ')}
        bad_ciphers = list(used_ciphers - accepted_ciphers)
        signature_algorithm = sslyze.get("Signature Algorithm", "sha1")

        match = re.match(r"sha(?:3-)?(\d+)(?:-\d+)?$", signature_algorithm)
        if match:
            good_cert = int(match.group(1)) >= 256
        else:
            LOGGER.error("Could not decipher %s algorithm", signature_algorithm)
        acceptable_ciphers = not bad_ciphers

        if any([any_rc4, any_3des, sslv2, sslv3, tlsv10, tlsv11]):
            bod_crypto = 0
        else:
            bod_crypto = 1

    report["bod_crypto"] = bod_crypto
    report["rc4"] = any_rc4
    report["3des"] = any_3des
    report["sslv2"] = sslv2
    report["sslv3"] = sslv3
    report["accepted_ciphers"] = acceptable_ciphers
    report["bad_ciphers"] = bad_ciphers
    report["good_cert"] = good_cert
    report["signature_algorithm"] = signature_algorithm
    report["tlsv10"] = tlsv10
    report["tlsv11"] = tlsv11

    # Final calculation: is the service compliant with all of M-15-13
    # (HTTPS+HSTS) and BOD 18-01 (that + RC4/3DES/SSLv2/SSLv3)?

    # For M-15-13 compliance, the service has to enforce HTTPS,
    # and has to have strong HSTS in place (can be via preloading).
    m1513 = (behavior >= 2) and (hsts >= 2)

    # For BOD compliance, only ding if we have scan data:
    # * If our scanner dropped, give benefit of the doubt.
    # * If they have no HTTPS, this will fix itself once HTTPS comes on.
    bod1801 = m1513 and (bod_crypto != 0)

    # Phew!
    report["m1513"] = m1513
    report["compliant"] = bod1801  # equivalent, since BOD is a superset

    return report


# Just returns a 0 or 2 for inactive (not live) zones, where
# we still may care about preloaded state.
def preloaded_or_not(pshtt):
    if boolean_for(pshtt["HSTS Preloaded"]):
        return 2  # Yes
    return 0  # No


# 'eligible' should be a list of dicts with https report data.
def total_https_report(eligible):
    total_report = {
        "eligible": len(eligible),
        "uses": 0,
        "enforces": 0,
        "hsts": 0,
        # compliance roll-ups
        "m1513": 0,
        "compliant": 0,
    }

    for report in eligible:

        # Needs to be enabled, with issues is allowed
        if report["uses"] >= 1:
            total_report["uses"] += 1

        # Needs to be Default or Strict to be 'Yes'
        if report["enforces"] >= 2:
            total_report["enforces"] += 1

        # Needs to be present with >= 1 year max-age for canonical endpoint,
        # or preloaded via its parent zone.
        if report["hsts"] >= 2:
            total_report["hsts"] += 1

        # Factors in crypto score, but treats ineligible services as passing.
        for field in ["m1513", "compliant"]:
            if report[field]:
                total_report[field] += 1

    return total_report


def total_crypto_report(eligible):
    total_report = {
        "eligible": len(eligible),
        "bod_crypto": 0,
        "rc4": 0,
        "3des": 0,
        "sslv2": 0,
        "sslv3": 0,
        "accepted_ciphers": 0,
        "tlsv10": 0,
        "tlsv11": 0,
        "good_cert": 0,
    }

    for report in eligible:
        if report.get("bod_crypto") is None:
            continue

        # Needs to be a Yes
        if report["bod_crypto"] == 1:
            total_report["bod_crypto"] += 1

        # Tracking separately, may not display separately
        if report["rc4"]:
            total_report["rc4"] += 1
        if report["3des"]:
            total_report["3des"] += 1
        if report["sslv2"]:
            total_report["sslv2"] += 1
        if report["sslv3"]:
            total_report["sslv3"] += 1
        if report["accepted_ciphers"]:
            total_report["accepted_ciphers"] += 1
        if report["tlsv10"]:
            total_report["tlsv10"] += 1
        if report["tlsv11"]:
            total_report["tlsv11"] += 1
        if report["good_cert"]:
            total_report["good_cert"] += 1

    return total_report


def total_preloading_report(eligible):
    total_report = {"eligible": len(eligible), "preloaded": 0, "preload_ready": 0}

    # Tally preloaded and preload-ready
    for report in eligible:
        # We consider *every* domain eligible for preloading,
        # so there may be no pshtt data for some.
        if report.get("preloaded") is None:
            continue

        if report["preloaded"] == 1:
            total_report["preload_ready"] += 1
        elif report["preloaded"] == 2:
            total_report["preloaded"] += 1

    return total_report


# Hacky helper - print out the %'s after the command finishes.
def print_report(report):

    for report_type in report.keys():
        if report_type == "report_date" or report_type == "_id":
            continue

        LOGGER.info("[%s]", report_type)
        eligible = report[report_type]["eligible"]
        for key in report[report_type].keys():
            if key == "eligible":
                LOGGER.info("%s: %i", key, report[report_type][key])
            else:
                LOGGER.info(
                    "%s: %i%% (%i)",
                    key,
                    percent(report[report_type][key], eligible),
                    report[report_type][key],
                )


### utilities
def shell_out(command, env=None):
    try:
        LOGGER.info("[cmd] %s", " ".join(command))
        response = subprocess.check_output(command, shell=False, env=env)
        output = str(response, encoding="UTF-8")
        LOGGER.info(output)
        return output
    except subprocess.CalledProcessError:
        logging.critical("Error running %s.", " ".join(command))
        exit(1)
        return None


def percent(num, denom):
    if denom == 0:
        return 0  # for shame!
    return round((num / denom) * 100)


# mkdir -p in python, from:
# https://stackoverflow.com/questions/600268/mkdir-p-functionality-in-python
def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST:
            pass
        else:
            raise


def write(content, destination, binary=False):
    mkdir_p(os.path.dirname(destination))

    if binary:
        file = open(destination, "bw")
    else:
        file = open(destination, "w", encoding="utf-8")
    file.write(content)
    file.close()


def boolean_for(string):
    if string == "False":
        return False
    return True
