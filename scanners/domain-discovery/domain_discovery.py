import subprocess
import logging
import os
import shutil
from arango import ArangoClient

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s"
)
logger = logging.getLogger()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")


# Establish DB connection
arango_client = ArangoClient(hosts=DB_URL)
db = arango_client.db(DB_NAME, username=DB_USER, password=DB_PASS)


def subdomain_enumeration(domain):
    logging.info("Running findomain for {domain}".format(domain=domain))
    subprocess.run(["findomain", "-t", domain, "-o"])


def process_subdomains(base_domain, orgId):
    f = open("{domain}.txt".format(domain=base_domain), "r")
    subdomains = f.readlines()
    subdomains = [domain.strip() for domain in subdomains]
    claimed_domains = get_claimed_domains(orgId)
    for subdomain in subdomains:
        if subdomain not in claimed_domains:
            logging.info("Adding {subdomain} to DB".format(subdomain=subdomain))
            checkDomain = db.collection("domains").find({"domain": subdomain}).next()
            if not checkDomain:
                domainInsert = db.collection("domains").insert(
                    {
                        "domain": subdomain,
                        "lastRan": None,
                        "selectors": [],
                        "hash": None,
                        "status": {
                            "certificates": None,
                            "dkim": None,
                            "dmarc": None,
                            "https": None,
                            "spf": None,
                            "ssl": None,
                        },
                        "archived": False,
                    }
                )
            else:
                domainInsert = checkDomain
            db.collection("claims").insert(
                {
                    "_from": orgId,
                    "_to": domainInsert["_id"],
                    "hidden": False,
                    "tags": [],
                }
            )
            # TODO publish to NATS


def get_claimed_domains(orgId):
    # Get existing domains in org
    cursor = db.aql.execute(
        "FOR v, e IN 1..1 OUTBOUND @val claims RETURN v.domain",
        bind_vars={"val": orgId},
        batch_size=2,
        count=True,
    )
    return [document for document in cursor]


def domain_discovery(domain="", orgId=""):
    try:
        os.mkdir("domains")
        os.chdir("domains")
    except FileExistsError:
        os.chdir("domains")

    if domain == "":
        print("No domain provided")
    else:
        print("Running domain discovery for {domain}".format(domain=domain))
        subdomain_enumeration(domain)
        process_subdomains(domain, orgId)
        os.chdir("../")
        shutil.rmtree("domains")


if __name__ == "__main__":
    domain_discovery("domain.gc.ca", "organizations/1234")
