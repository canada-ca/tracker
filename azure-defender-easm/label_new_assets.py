import sys
import logging
import json
from update_asset import label_assets
from kusto_client import get_unlabelled_org_assets_from_roots


logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def update_asset_labels_from_file(filename):
    with open(filename) as json_file:
        data = json.load(json_file)
        for k, v in data.items():
            logging.info("Labeling assets for " + k)
            org_assets = get_unlabelled_org_assets_from_roots(v["rootDomains"])
            logging.info("Found " + str(len(org_assets)) + " assets")
            label_assets(assets=org_assets, label=v["labelName"])


if __name__ == "__main__":
    logging.info("Summary service started")
    update_asset_labels_from_file("./loader_objects/root_domains_loader.json")
    logging.info(f"Summary service shutting down...")
