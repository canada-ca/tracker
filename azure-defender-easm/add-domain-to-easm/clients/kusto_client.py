from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table


import os
from dotenv import load_dotenv

load_dotenv()

KUSTO_CLUSTER = os.getenv("KUSTO_CLUSTER")
REGION = os.getenv("REGION")
KUSTO_DATABASE = os.getenv("KUSTO_DATABASE")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")

KCSB_DATA = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    f"https://{KUSTO_CLUSTER}.{REGION}.kusto.windows.net",
    CLIENT_ID,
    CLIENT_SECRET,
    TENANT_ID,
)
KUSTO_CLIENT = KustoClient(KCSB_DATA)


def get_host_asset(host_name):
    query = f"EasmHostAsset | where Host == '{host_name}' | limit 1"
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data
