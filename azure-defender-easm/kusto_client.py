from azure.kusto.data import KustoClient, KustoConnectionStringBuilder

import os
from dotenv import load_dotenv

load_dotenv()

KUSTO_CLUSTER = os.getenv("KUSTO_CLUSTER")
KUSTO_DATABASE = os.getenv("KUSTO_DATABASE")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
AUTHORITY_ID = os.getenv("TENANT_ID")

KCSB_DATA = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    KUSTO_CLUSTER, CLIENT_ID, CLIENT_SECRET, AUTHORITY_ID
)
KUSTO_CLIENT = KustoClient(KCSB_DATA)
