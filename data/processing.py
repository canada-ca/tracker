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
from urllib.parse import urlparse

from shutil import copyfile, copytree, Error

import slugify
import pymongo.errors

# Import all the constants from data/env.py.
from data import env
from data import logger
from data import models


LOGGER = logger.get_logger(__name__)

# domains.csv is downloaded and live-cached during the scan
SCAN_CACHE = os.path.join(env.SCAN_DATA, "cache")
SCAN_DOMAINS_CSV = os.path.join(SCAN_CACHE, "domains.csv")
MIN_HSTS_AGE = 31536000 # one year

###
# Main task flow.

# Read in data from domains.csv, and scan data from domain-scan.
# All database operations are made in the run() method.
#
# This method blows away the database and rebuilds it from the given data.
def run(date: typing.Optional[str], connection_string: str,
        batch_size: typing.Optional[int] = None):
    if date is None:
        date = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d")

    # Read in domains and organizations from domains.csv.
    # Returns dicts of values ready for saving as Domain and Agency objects.
    #
    # Also returns gathered subdomains, which need more filtering to be useful.
    domains, owners = load_domain_data()
    results = {}
    acceptable_ciphers = load_compliance_data()

    # Read in domain-scan CSV data.
    scan_data = load_scan_data(domains)

    # Capture manual exclusions and pull out some high-level data from pshtt.
    for domain_name in scan_data:
        # Pull out a few pshtt.csv fields as general domain-level metadata.
        domain_data = scan_data[domain_name]

        pshtt = domain_data.get("pshtt", None)
        if pshtt is None:
            # generally means scan was on different domains.csv, but
            # invalid domains can hit this.
            LOGGER.warning("[%s] No pshtt data for domain!", domain_name)
        elif boolean_for(pshtt['Live']):
            if boolean_for(pshtt['Redirect']):
                redirection = urlparse(pshtt["Redirect To"]).netloc
                if redirection not in domains:
                    LOGGER.warning("%s redirected to %s which is not in the domains list", domain_name, redirection)

            results[domain_name] = {
                "domain": domain_name,
                "is_owner": domain_name in owners,
                "is_parent": domain_name in owners,
                "sources": ["canada-gov"],
                "live": True,
                "redirect": boolean_for(pshtt["Redirect"]),
                "redirect_url": urlparse(pshtt["Redirect To"]).geturl(),
                "canonical": pshtt["Canonical URL"],
                "exclude": {},
            }

    # Find the parent domain for all domains in the owner list, mutating results in place
    map_subdomains(results, owners)

    # Extract organizations actually used in the set of scanned domains, and their counts
    organizations = extract_orgs(results)

    sorted_domains = list(results.keys())
    sorted_domains.sort()
    sorted_organizations = list(organizations.keys())
    sorted_organizations.sort()

    # Calculate high-level per-domain conclusions for each report.
    # Overwrites `results` in place
    process_https(
        results, scan_data, acceptable_ciphers
    )
    # Totals scan data for parent domains
    total_reports(
        results, owners,
    )

    # Calculate organization-level summaries. Updates `organizations` in-place.
    update_organization_totals(organizations, results)

    # Calculate government-wide summaries.
    report = full_report(results)
    report["report_date"] = date


    # Backup cached results to the specified directory ahead of database insertions
    backup_scan_results(pathlib.Path(env.SCAN_DATA))


    # Reset the database.
    with models.Connection(connection_string) as connection:
        LOGGER.info("Updating or creating all domains.")

        # get remote list of domains
        remote_in_domains = [document['domain'] for document in connection.domains.all()]

        # use set logic to find the set of domains that need to be removed
        id_removals = set(remote_in_domains) - set(sorted_domains)

        # add scan date in all domain records
        scan_date(results, date)

        connection.domains.upsert_all((results[domain_name] for domain_name in sorted_domains),
                                      'domain', batch_size=batch_size)

        LOGGER.info("Domain removals: %s", id_removals)
        # Delete domain results from 'domains' table
        for record in id_removals:
            resp = connection.domains.delete_one({"domain": record})
            if resp.deleted_count != 1:
                LOGGER.error("Failed deletion of domain from 'domains' collection: %s", record)
            else:
                LOGGER.warning("Domain deleted from 'domains' collection: %s", record)

        LOGGER.info("Updating or creating organizations.")

        # add scan date in all org records
        scan_date(organizations, date)

        # get remote list of org
        remote_in_org = [document['slug'] for document in connection.organizations.all()]

        connection.organizations.upsert_all(
            (organizations[organization_name] for organization_name in sorted_organizations),
            'slug', batch_size=batch_size)

        # use set logic to find the set of input_domains that need to be removed
        id_removals = set(remote_in_org) - set(sorted_organizations)

        LOGGER.info("Organization removals: %s", id_removals)

        # Delete org results from 'organizations' table
        for record in id_removals:
            resp = connection.organizations.delete_one({"slug": record})
            if resp.deleted_count != 1:
                LOGGER.error("Failed deletion of organization from 'organizations' collection: %s", record)
            else:
                LOGGER.warning("Organization deleted from 'organizations' collection: %s", record)


        LOGGER.info("Clearing the domains.")
        connection.domains.clear(batch_size=batch_size)
        try:
            LOGGER.info("Creating all domains.")
            connection.domains.create_all((results[domain_name] for domain_name in sorted_domains),
                                          batch_size=batch_size)
        except pymongo.errors.DocumentTooLarge:
            LOGGER.exception("An error was encountered while inserting domains into the database. "
                             "Document exceeds PyMongo maximum document size.")
        except pymongo.errors.WriteConcernError as exc:
            LOGGER.exception("An error was encountered while inserting domains into the database"
                             " (Write Concern Error). Exception details: %s", str(exc.details))
        except pymongo.errors.WriteError as exc:
            LOGGER.exception("An error was encountered while inserting domains into the database"
                             " (Write Error). Exception details: %s", str(exc.details))
        except pymongo.errors.OperationFailure as exc:
            LOGGER.exception("An error was encountered while inserting domains into the database"
                             " (Operation Failure). Exception details: %s", str(exc.details))
        except pymongo.errors.PyMongoError:
            LOGGER.exception("An error was encountered while inserting domains into the database"
                             " (PyMongoError).")

        LOGGER.info("Clearing organizations.")
        connection.organizations.clear(batch_size=batch_size)

        try:
            LOGGER.info("Creating all organizations.")
            connection.organizations.create_all(
                (organizations[organization_name] for organization_name in sorted_organizations), batch_size=batch_size
            )
        except pymongo.errors.DocumentTooLarge:
            LOGGER.exception("An error was encountered while inserting organizations into the database. "
                             "Document exceeds PyMongo maximum document size.")
        except pymongo.errors.WriteConcernError as exc:
            LOGGER.exception("An error was encountered while inserting organizations into the database"
                             " (Write Concern Error). Exception details: %s", str(exc.details))
        except pymongo.errors.WriteError as exc:
            LOGGER.exception("An error was encountered while inserting organizations into the database"
                             " (Write Error). Exception details: %s", str(exc.details))
        except pymongo.errors.OperationFailure as exc:
            LOGGER.exception("An error was encountered while inserting organizations into the database"
                             " (Operation Failure). Exception details: %s", str(exc.details))
        except pymongo.errors.PyMongoError:
            LOGGER.exception("An error was encountered while inserting organizations into the database"
                             " (PyMongoError).")

        try:
            LOGGER.info("Replacing government-wide totals.")
            connection.reports.replace({}, report)
        except pymongo.errors.DocumentTooLarge:
            LOGGER.exception("An error was encountered while replacing government-wide totals within the database. "
                             "Document exceeds PyMongo maximum document size.")
        except pymongo.errors.WriteConcernError as exc:
            LOGGER.exception("An error was encountered while replacing government-wide totals within the database"
                             " (Write Concern Error). Exception details: %s", str(exc.details))
        except pymongo.errors.WriteError as exc:
            LOGGER.exception("An error was encountered while replacing government-wide totals within the database"
                             " (Write Error). Exception details: %s", str(exc.details))
        except pymongo.errors.OperationFailure as exc:
            LOGGER.exception("An error was encountered while replacing government-wide totals within the database"
                             " (Operation Failure). Exception details: %s", str(exc.details))
        except pymongo.errors.PyMongoError:
            LOGGER.exception("An error was encountered while replacing government-wide totals within the"
                             " database (PyMongoError).")


        LOGGER.info("Saving report to historical collection")
        report2 = report.copy()
        # to be able to query reports by date
        report2['report_timestamp'] = datetime.datetime.today()
        connection.historical.create(report2)

        LOGGER.info("Update cache validity with current time for track-web")
        connection.flags.replace({}, {"cache": datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M")})

    # Print and exit
    print_report(report)


def backup_scan_results(path: pathlib.Path):
    # If the backup results directory has NOT been created, create it along with subdirectories
    if not os.path.isdir(str(os.path.join(os.getcwd(), 'data/backupScanResults'))):
        os.mkdir(str(os.path.join(os.getcwd(), 'data/backupScanResults')))


    result_path = os.path.join(os.getcwd(), 'data/backupScanResults/results')
    cache_path = os.path.join(os.getcwd(), 'data/backupScanResults/cache')

    # Attempt to copy result directory
    try:
        copytree(str(os.path.join(str(path), 'results')), str(os.path.join(result_path, str(datetime.datetime.now()))))
    except Error as err:
        LOGGER.exception("Error occurred while backing up scan result files: %s", str(err))

    # Attempt to copy cache directory
    try:
        copytree(str(os.path.join(str(path), 'cache')), str(os.path.join(cache_path, str(datetime.datetime.now()))))
    except Error as err:
        LOGGER.exception("Error occurred while backing up scan cache files: %s", str(err))
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

    domain_map = {}
    domains = set()

    # if domains.csv wasn't cached, download it anew
    if not os.path.exists(SCAN_DOMAINS_CSV):
        cache_file(env.DOMAINS)

    owner_path = cache_file(env.OWNERSHIP)

    if not os.path.exists(SCAN_DOMAINS_CSV):
        LOGGER.critical("Couldn't download domains.csv")
        exit(1)

    with owner_path.open('r', encoding='utf-8-sig', newline='') as csvfile:
        for row in csv.reader(csvfile):
            if row == []: # deal with trailing newlines..
                LOGGER.warning("Trailing newline detected in %s.", owner_path)
                continue
            if row[0].lower().startswith("domain"):
                continue

            domain_name = row[0].lower().strip()
            organization_name_en = row[1].strip()
            organization_name_fr = row[2].strip()
            organization_slug = slugify.slugify(organization_name_en)

            if domain_name not in domain_map:
                domain_map[domain_name] = {
                    "organization_name_en": organization_name_en,
                    "organization_name_fr": organization_name_fr,
                    "organization_slug": organization_slug,
                }

    with open(SCAN_DOMAINS_CSV, newline="") as csvfile:
        for row in csv.reader(csvfile):
            if row[0].lower().startswith("domain"):
                continue

            domain = row[0].lower().strip()
            domains.add(domain)

    return domains, domain_map


def extract_orgs(domains: typing.Dict) -> typing.Dict:
    organizations = {}
    for doc in domains.values():
        slug = doc['organization_slug']
        organization = organizations.setdefault(slug, {
            "name_en": doc['organization_name_en'],
            "name_fr": doc['organization_name_fr'],
            "slug": slug,
            "total_domains": 0,
        })
        organization["total_domains"] += 1
    return organizations

# Load in data from the CSVs produced by domain-scan.
# The 'domains' map is used to ignore any untracked domains.
def load_scan_data(domains: typing.Set[str]) -> typing.Dict:
    parent_scan_data = {}
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


def map_subdomains(domains, owners):
    for domain in domains:
        if not domains[domain]["is_owner"]:
            parts = domain.split('.')
            parent = domain
            while parts and parent not in owners:
                parts = parts[1:]
                parent = '.'.join(parts)

            if not parts:
                domains[domain].update({
                    "base_domain": domain,
                    "is_parent": True,
                    "organization_name_en": 'Government of Canada',
                    "organization_name_fr": 'Gouvernement du Canada',
                    "organization_slug": 'government-of-canada',
                })
                continue

            parent = '.'.join(parts)

            subdomains = owners[parent].setdefault("subdomains", [])
            subdomains.append(domain)
            domains[domain].update({
                "base_domain": parent,
                # If the owners was not scanned, let all subdomains become 'parents' so they are displayed
                "is_parent": parent not in domains,
                "organization_slug": owners[parent]["organization_slug"],
                "organization_name_en": owners[parent]["organization_name_en"],
                "organization_name_fr": owners[parent]["organization_name_fr"],
            })
        else:
            domains[domain].update({
                "base_domain": domain,
                "is_parent": True,
                "organization_slug": owners[domain]["organization_slug"],
                "organization_name_en": owners[domain]["organization_name_en"],
                "organization_name_fr": owners[domain]["organization_name_fr"],
            })



# Given the domain data loaded in from CSVs, draw conclusions,
# and filter/transform data into form needed for display.
def process_https(domains, scan_data, acceptable_ciphers):
    # For each domain, determine eligibility and, if eligible,
    # use the scan data to draw conclusions.
    for domain_name in domains:

        ### HTTPS
        #
        # For HTTPS, we calculate individual reports for every subdomain.

        https_parent = {
            "eligible": False,  # domain eligible itself (is it live?)
            "eligible_zone": False,  # zone eligible (itself or any live subdomains?)
        }

        # No matter what, put the preloaded state onto the parent,
        # since even an unused domain can always be preloaded.
        try:
            parent_preloaded = preloaded_or_not(
                scan_data[domains[domain_name]['base_domain']]["pshtt"]
            ) if not domains[domain_name]["is_parent"] else 0
        except KeyError:
            # The parent domain wasn't in the list of domains to scan, assume it is not preloaded
            parent_preloaded = 0

        if eligible_for_https(domains[domain_name]):
            https_parent = {
                **https_parent,
                **https_behavior_for(
                    scan_data[domain_name]["pshtt"],
                    scan_data[domain_name].get("sslyze"),
                    acceptable_ciphers,
                    parent_preloaded
                )
            }
            https_parent["eligible_zone"] = True
        domains[domain_name]["https"] = https_parent


def total_reports(domains, owners):
    for domain_name in (domain for domain in domains if domains[domain]["is_parent"]):
        https_parent = domains[domain_name]["https"]

        subdomain_names = owners.get(domain_name, {}).get("subdomains", [])
        eligible_children = {
            name for name in subdomain_names if eligible_for_https(domains[name])
        }

        # Totals based on summing up eligible reports within this domain.
        totals = {}

        https_parent["eligible_zone"] |= True if eligible_children else False

        # For HTTPS/HSTS, pshtt-eligible parent + subdomains.
        eligible_reports = [domains[name]["https"] for name in eligible_children]
        if https_parent["eligible"]:
            eligible_reports = [https_parent] + eligible_reports
        totals["https"] = total_https_report(eligible_reports)

        # For SSLv2/SSLv3/RC4/3DES, sslyze-eligible parent + subdomains.
        eligible_reports = [
            domains[name]["https"]
            for name in subdomain_names
            if domains[name].get("https")
            and domains[name]["https"].get("rc4") is not None
        ]
        if https_parent.get("rc4") is not None:
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
            if hsts_age >= MIN_HSTS_AGE:
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
    good_cert = -1
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
        acceptable_ciphers = not bad_ciphers

        match = re.match(r"sha(?:3-)?(\d+)(?:-\d+)?$", signature_algorithm)
        if match:
            good_cert = int(int(match.group(1)) >= 256)
        else:
            LOGGER.error("Could not decipher %s algorithm", signature_algorithm)


        if any([any_rc4, any_3des, sslv2, sslv3, tlsv10, tlsv11, not acceptable_ciphers]):
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

    https_compliant = (behavior >= 2) and (hsts >= 2)
    # Very specific and intentional checks on bod_crypto and good_cert
    #   - bod_crypto if -1, which is an indication that we did not get results
    #     and therefore it can't be ITPIN compliant
    #   - good_cert has to be true in order to be compliant as well i.e. can't be None
    itpin_compliant = https_compliant and bod_crypto > 0 and good_cert
    report["compliant"] = int(itpin_compliant) # Cast to int to help presentation layer

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
        "compliant": 0,
    }

    for report in eligible:

        # Needs to be enabled, with issues is allowed
        if report["uses"] >= 1:
            total_report["uses"] += 1

        # Needs to be Default or Strict to be 'Yes'
        if report["enforces"] >= 2:
            total_report["enforces"] += 1

        # Needs to be present with >= one year max-age for canonical endpoint,
        # or preloaded via its parent zone.
        if report["hsts"] >= 2:
            total_report["hsts"] += 1

        # Factors in crypto score, but treats ineligible services as passing.
        if report["compliant"] > 0:
            total_report["compliant"] += 1

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
        if report["good_cert"] > 0:
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
    elif string == "True":
        return True
    return None


# set scan date for all records
def scan_date(documents: typing.Iterable[typing.Dict], date: str):
    for value in documents.values():
        value.update({"scan_date": date})
