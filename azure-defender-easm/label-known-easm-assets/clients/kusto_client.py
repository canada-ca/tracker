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


def get_unlabelled_org_assets_from_root(root):
    query = f"""
    declare query_parameters(domainRoot:string = '{root}');
    EasmAsset
    | where TimeGeneratedValue > ago(24h)
    | where AssetType == 'HOST'
    | where AssetName == domainRoot or AssetName endswith '.' + domainRoot
    | where Labels == '[]'
    | project AssetName, AssetUuid, Labels
    """
    try:
        response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
        data = dataframe_from_result_table(response.primary_results[0]).to_dict(
            orient="records"
        )
        return data
    except Exception as e:
        print(f"Failed to get unlabelled assets from roots: {e}")
        return []


def get_unlabelled_org_assets_from_domains(domains):
    query = f"""
    declare query_parameters(domains:dynamic = dynamic({domains}));
    EasmAsset
    | where TimeGeneratedValue > ago(24h)
    | where AssetType == 'HOST'
    | where AssetName in (domains)
    | where Labels == '[]'
    | project AssetName, AssetUuid, Labels
    | order by AssetName asc
    """
    try:
        response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
        data = dataframe_from_result_table(response.primary_results[0]).to_dict(
            orient="records"
        )
        return data
    except Exception as e:
        print(f"Failed to get unlabelled assets: {e}")
        return []
