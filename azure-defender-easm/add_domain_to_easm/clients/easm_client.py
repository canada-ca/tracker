import os
from azure.identity import ClientSecretCredential
from azure.defender.easm import EasmClient
from dotenv import load_dotenv

load_dotenv()

sub_id = os.getenv("SUBSCRIPTION_ID")
workspace_name = os.getenv("WORKSPACE_NAME")
resource_group = os.getenv("RESOURCE_GROUP")
region = os.getenv("REGION")
endpoint = f"{region}.easm.defender.microsoft.com"

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
tenant_id = os.getenv("TENANT_ID")
credential = ClientSecretCredential(
    client_id=client_id, client_secret=client_secret, tenant_id=tenant_id
)

EASM_CLIENT = EasmClient(endpoint, resource_group, sub_id, workspace_name, credential)


def run_disco_group(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
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
