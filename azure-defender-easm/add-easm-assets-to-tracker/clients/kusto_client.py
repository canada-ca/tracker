from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

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


def get_labelled_org_assets_from_org_key(org_key):
    query = f"""
    declare query_parameters(orgKey:string = '["{org_key}"]');
    EasmAsset
    | where TimeGeneratedValue > ago(24h)
    | where AssetLastSeen > ago(30d)
    | where AssetType == 'HOST'
    | where Labels == orgKey
    | where AssetName !startswith '*.'
    | join kind=inner EasmHostAsset on AssetName
    | where TimeGeneratedValue > ago(24h)
    | where Cnames == '[]'
    | summarize by AssetName
    """
    try:
        response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
        data = dataframe_from_result_table(response.primary_results[0]).to_dict(
            orient="records"
        )
        return [asset["AssetName"] for asset in data]
    except Exception as e:
        logger.error(f"Failed to get labelled assets from org key: {e}")
        return []


def get_unlabelled_assets():
    query = f"""
    EasmAsset
    | where TimeGeneratedValue > ago(24h)
    | where AssetLastSeen > ago(30d)
    | where AssetType == 'HOST'
    | where Labels == '[]'
    | where AssetName !startswith '*.'
    | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca'
    | join kind=inner EasmHostAsset on AssetName
    | where TimeGeneratedValue > ago(24h)
    | where Cnames == '[]'
    | summarize by AssetName
    """
    try:
        response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
        data = dataframe_from_result_table(response.primary_results[0]).to_dict(
            orient="records"
        )
        return [asset["AssetName"] for asset in data]
    except Exception as e:
        logger.error(f"Failed to get unlabelled assets: {e}")
        return []
