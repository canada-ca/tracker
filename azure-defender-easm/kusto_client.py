from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

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


def get_host_asset(host_name):
    query = f"EasmHostAsset | where Host == '{host_name}' | limit 1"
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_page_asset(page_name):
    query = f"EasmPageAsset | where Host == '{page_name}' | take 1"
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_hosts_with_ddos_protection():
    query = "EasmHostAsset | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca' | where WebComponents has 'DDOS Protection' | order by TimeGenerated desc | project TimeGenerated, AssetName, WebComponents"
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_unlabelled_org_assets_from_roots(roots):
    query = f"""
    let org_roots = dynamic({roots});
    EasmAsset
    | where AssetType == 'HOST'
    | where AssetName has_any (org_roots)
    | where Labels == '[]'
    | summarize by AssetName, AssetId, AssetUuid, Labels
    | order by AssetName asc
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data
