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


def label_assets(assets, label):
    update_ids = []
    for asset in assets:
        update_request = {"labels": {f"{label}": True}}
        asset_filter = f"uuid = {asset['AssetUuid']}"
        update = EASM_CLIENT.assets.update(body=update_request, filter=asset_filter)
        update_ids.append(update["id"])
        print(f"{asset['AssetName']} labeled with {label}")

    # Using the `tasks` EASM_CLIENT, we can view the progress of each update using the `get` method
    for update_id in update_ids:
        update = EASM_CLIENT.tasks.get(update_id)
        print(f'{update["id"]}: {update["state"]}')
