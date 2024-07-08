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


def get_web_components_by_asset(asset):
    query = f"""
    declare query_parameters(asset_name:string = '{asset}');
    EasmAssetWebComponent
    | where AssetName == asset_name
    | where TimeGeneratedValue > ago(24h)
    | summarize arg_max(TimeGeneratedValue, WebComponentCves, WebComponentPorts) by WebComponentName, WebComponentCategory, WebComponentVersion, WebComponentFirstSeen, WebComponentLastSeen
    | project WebComponentName, WebComponentCategory, WebComponentVersion, WebComponentFirstSeen, WebComponentLastSeen, WebComponentCves, WebComponentPorts
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )

    for wc in data:
        # format datetime to isoformat
        wc["WebComponentFirstSeen"] = wc["WebComponentFirstSeen"].isoformat()
        wc["WebComponentLastSeen"] = wc["WebComponentLastSeen"].isoformat()

        # filter cves to only top 25
        top25 = [
            "CVE-2018-7600",
            "CVE-2021-44228",
            "CVE-2019-11043",
            "CVE-2022-1388",
            "CVE-2018-7602",
            "CVE-2018-13379",
            "CVE-2021-40438",
            "CVE-2021-21975",
            "CVE-2019-0211",
            "CVE-2021-34473",
            "CVE-2024-27198",
            "CVE-2022-30190",
            "CVE-2023-46747",
            "CVE-2020-28949",
            "CVE-2024-1709",
            "CVE-2024-3400",
            "CVE-2023-23397",
            "CVE-2020-36193",
            "CVE-2023-3519",
            "CVE-2023-49103",
            "CVE-2021-34523",
            "CVE-2023-44487",
            "CVE-2023-29357",
            "CVE-2014-0160",
            "CVE-2017-3506",
        ]
        wc["WebComponentCves"] = [
            cve for cve in wc["WebComponentCves"] if cve["Cve"] in top25
        ]

    return data


def get_additional_findings_by_asset(asset):
    query = f"""
    declare query_parameters(asset_name:string = '{asset}');
    EasmHostAsset
    | where AssetName == asset_name
    | where TimeGeneratedValue > ago(24h)
    | order by TimeGeneratedValue desc
    | limit 1
    | project Locations, Ports, Headers
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )[0]
    return data
