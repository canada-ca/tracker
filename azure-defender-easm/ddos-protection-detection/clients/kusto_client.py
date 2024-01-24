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
AUTHORITY_ID = os.getenv("TENANT_ID")

KCSB_DATA = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    f"https://{KUSTO_CLUSTER}.{REGION}.kusto.windows.net",
    CLIENT_ID,
    CLIENT_SECRET,
    AUTHORITY_ID,
)
KUSTO_CLIENT = KustoClient(KCSB_DATA)


def get_hosts_with_ddos_protection():
    query = """
    EasmHostAsset
    | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca'
    | where WebComponents has 'DDOS Protection'
    | summarize by AssetName
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_hosts_without_ddos_protection():
    query = """
    EasmHostAsset
    | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca'
    | where WebComponents !has 'DDOS Protection'
    | summarize by AssetName
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def host_has_ddos_protection(domain):
    query = f"""
    EasmHostAsset
    | where AssetName == '{domain}'
    | where WebComponents has 'DDOS Protection'
    | project AssetName
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return len(data) > 0
