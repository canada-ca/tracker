import os
import logging
from azure.identity import ClientSecretCredential
from azure.defender.easm import EasmClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

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


def run_disco_group(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        logger.info(f"Running discovery group {group_name}")
        EASM_CLIENT.discovery_groups.run(group_name)


def list_disco_group_runs(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        return EASM_CLIENT.discovery_groups.list_runs(group_name)


def get_disco_group(group_name):
    disco_group = EASM_CLIENT.discovery_groups.get(group_name)
    return disco_group


def create_disco_group(name, assets, frequency=0):
    request = {
        "description": "Discovery group made for discovering assets for " + name,
        "seeds": assets,
        "frequencyMilliseconds": frequency,
    }
    response = EASM_CLIENT.discovery_groups.put(name, request)
    return response


def delete_disco_group(group_name):
    EASM_CLIENT.discovery_groups.delete(group_name)
