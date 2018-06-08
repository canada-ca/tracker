import os
import pkg_resources
import yaml

DATA_DIR = os.path.join(os.getcwd(), 'data')

# App-level metadata.
_resource_package = __name__
_resource_path = 'data_meta.yml'
_meta_content = pkg_resources.resource_string(_resource_package, _resource_path).decode('utf-8')
META = yaml.safe_load(_meta_content)

DOMAINS = os.environ.get("DOMAINS", META["data"]["domains_url"])
OWNERSHIP = os.environ.get("OWNERSHIP", META["data"]["ownership_url"])
CIPHER = os.environ.get("CIPHERS", META["data"]["ciphers_url"])

# domain-scan paths (MUST be set in env)
SCAN_COMMAND = os.environ.get("DOMAIN_SCAN_PATH", './domain-scan/scan')

# post-processing and uploading information
SCAN_DATA = os.path.join(DATA_DIR, "output/domains")
SCAN_RESULTS = os.path.join(SCAN_DATA, 'results')

### Parent domain scanning information
# Run these scanners over *all* (which is a lot) discovered subdomains.
SCANNERS = ["pshtt", "sslyze"]

# Used if --lambda is enabled during the scan.
LAMBDA_WORKERS = 900
