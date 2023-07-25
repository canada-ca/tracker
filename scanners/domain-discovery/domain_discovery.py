import subprocess
import logging
import os
import shutil
import concurrent.futures
from pymongo import MongoClient

# from time import sleep

import dns.resolver
from dns.resolver import Resolver

# from selenium import webdriver
# from selenium.webdriver import ChromeOptions
# from webdriver_manager.chrome import ChromeDriverManager


logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

DB_NAME = os.getenv("DB_NAME") or "track_dmarc"
DB_URL = os.getenv("DB_URL") or "mongodb://root:test@localhost:27017"

# Establish DB connection
mongo_client = MongoClient(DB_URL)
db = mongo_client[DB_NAME]


def subdomain_enumeration(domains: list):
    """execute findomain to find subdomains

    Args:
        domains (list): list of domains to do discovery for
    """
    for domain in domains:
        logging.info
        subprocess.run(["findomain", "-t", domain, "-o"])


def process_subdomains(base_domain):
    """_summary_

    Args:
        base_domain (_type_): _description_
    """

    f = open("{domain}.txt".format(domain=base_domain), "r")
    subdomains = f.readlines()
    subdomains = [domain.strip() for domain in subdomains]
    existing_subdomains = get_existing_domains(base_domain)
    if not existing_subdomains:
        data = {"domain": base_domain, "baseDomain": "", "isRoot": True}
        insert = db.domains.insert_one(data)
        logging.info(insert.inserted_id)
        screenshot(base_domain, base_domain)

    os.chdir("../")
    if os.path.isdir("screenshots"):
        os.chdir("screenshots")
    else:
        os.mkdir("screenshots")
        os.chdir("screenshots")

    if os.path.isdir(base_domain):
        os.chdir(base_domain)
    else:
        os.mkdir(base_domain)
        os.chdir(base_domain)
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        [
            executor.submit(threading, domain, existing_subdomains, base_domain)
            for domain in subdomains
        ]
        # for future in concurrent.futures.as_completed(futures):

    os.chdir("../../domains")


def threading(domain, existing_subdomains, base_domain):
    if existing_subdomains is not None and domain in existing_subdomains:
        return False
    logging.info(domain)
    if check_live(domain):
        screenshot(domain, base_domain)
        data = {"domain": domain, "baseDomain": base_domain, "isRoot": False}
        insert = db.domains.insert_one(data)
        logging.info(insert.inserted_id)
        return True
    return False


def get_existing_domains(base_domain):
    subdomains = []
    for domain in db.domains.find({"isRoot": True}):
        if domain["domain"] == base_domain:
            for subdomain in db.domains.find(
                {"baseDomain": base_domain, "isRoot": False}
            ):
                subdomains.append(subdomain["domain"])
            return subdomains
    return None


def check_live(domain):
    resolver = Resolver()
    for query in ["A", "AAAA", "MX"]:
        try:
            response = resolver.resolve(domain, query)
            for _, address in enumerate(response):
                if not address.to_text() == "0 .":
                    return True
        except (
            dns.resolver.NoAnswer,
            dns.resolver.NXDOMAIN,
            dns.resolver.NoNameservers,
            dns.exception.Timeout,
            dns.name.EmptyLabel,
            dns.name.LabelTooLong,
        ) as err:
            logging.error("no result for %s", domain)
        except Exception as err:
            logging.error("Error occurred on %s", domain)


def screenshot(domain, base_domain):
    try:
        subprocess.run(["shot-scraper", domain])
    except:
        logging.info("screenshot error %s", domain)


def domain_discovery(domains=[]):
    try:
        os.mkdir("domains")
        os.chdir("domains")
    except FileExistsError:
        os.chdir("domains")

    if domains == []:
        fetchDomains = db.domains.find({"isRoot": True})
        domains = [domain["domain"] for domain in fetchDomains]
    subdomain_enumeration(domains)
    for domain in domains:
        process_subdomains(domain)
    os.chdir("../")
    shutil.rmtree("domains")


if __name__ == "__main__":
    domain_discovery(["canada.ca"])
