import os
import logging
from azure.identity import ClientSecretCredential
from azure.defender.easm import EasmClient
from dotenv import load_dotenv

load_dotenv()

SUB_ID = os.getenv("SUBSCRIPTION_ID")
WORKSPACE_NAME = os.getenv("WORKSPACE_NAME")
RESOURCE_GROUP = os.getenv("RESOURCE_GROUP")
REGION = os.getenv("REGION")
ENDPOINT = f"{REGION}.easm.defender.microsoft.com"

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
CREDENTIAL = ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET)

EASM_CLIENT = EasmClient(ENDPOINT, RESOURCE_GROUP, SUB_ID, WORKSPACE_NAME, CREDENTIAL)


def label_assets(assets, label):
    for asset in assets:
        update_request = {"labels": {f"{label}": True}}
        asset_filter = f"uuid = {asset['AssetUuid']}"
        try:
            EASM_CLIENT.assets.update(body=update_request, filter=asset_filter)
            logging.info(f"{asset['AssetName']} labeled with {label}")
        except Exception as e:
            logging.error(f"Failed to label {asset['AssetName']}: {e}")
            continue
