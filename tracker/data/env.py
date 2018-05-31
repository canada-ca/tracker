import os
import sys
import pkg_resources
import yaml

DATA_DIR = os.path.join(os.getcwd(), 'data')

# App-level metadata.
_resource_package = __name__
_resource_path = 'data_meta.yml'
_meta_content = pkg_resources.resource_string(_resource_package, _resource_path).decode('utf-8')
META = yaml.safe_load(_meta_content)

DOMAINS = os.environ.get("DOMAINS", META["data"]["domains_url"])

# domain-scan paths (MUST be set in env)
SCAN_COMMAND = os.environ.get("DOMAIN_SCAN_PATH", None)
GATHER_COMMAND = os.environ.get("DOMAIN_GATHER_PATH", None)


# post-processing and uploading information
PARENTS_DATA = os.path.join(DATA_DIR, "./output/parents")
PARENTS_RESULTS = os.path.join(DATA_DIR, "./output/parents/results")
SUBDOMAIN_DATA = os.path.join(DATA_DIR, "./output/subdomains")
SUBDOMAIN_DATA_GATHERED = os.path.join(DATA_DIR, "./output/subdomains/gather")
SUBDOMAIN_DATA_SCANNED = os.path.join(DATA_DIR, "./output/subdomains/scan")

DB_DATA = os.path.join(DATA_DIR, "./db.json")
BUCKET_NAME = META["bucket"]
AWS_REGION = META["aws_region"]

### Parent domain scanning information
# Run these scanners over *all* (which is a lot) discovered subdomains.
SCANNERS = ["pshtt", "sslyze"]

GATHER_SUFFIXES = os.environ.get("GATHER_SUFFIXES", ".ca,.gov.ca")

# names and options must be in corresponding order
GATHERER_NAMES = ["other", "canada-gov"]

GATHERER_OPTIONS = [
    "--other=%s" % META["data"]["other_subdomains_url"], "--canada-gov=%s" % DOMAINS
]


# Used if --lambda is enabled during the scan.
LAMBDA_WORKERS = 900

# Quick and dirty CLI options parser.
def options():
    options = {}
    for arg in sys.argv[1:]:
        if arg.startswith("--"):

            if "=" in arg:
                key, value = arg.split("=")
            else:
                key, value = arg, "true"

            key = key.split("--")[1]
            key = key.lower()
            value = value.lower()

            if value == "true":
                value = True
            elif value == "false":
                value = False
            options[key] = value

    return options
