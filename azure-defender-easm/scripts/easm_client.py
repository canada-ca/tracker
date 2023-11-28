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

client = EasmClient(endpoint, resource_group, sub_id, workspace_name, credential)
