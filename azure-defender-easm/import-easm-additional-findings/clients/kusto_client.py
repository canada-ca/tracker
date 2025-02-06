from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table
from datetime import datetime, date, timedelta
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
CVE_LIST = os.getenv("CVE_LIST")

KCSB_DATA = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    f"https://{KUSTO_CLUSTER}.{REGION}.kusto.windows.net",
    CLIENT_ID,
    CLIENT_SECRET,
    TENANT_ID,
)
KUSTO_CLIENT = KustoClient(KCSB_DATA)


def filter_recent_data(data_list, last_seen_key, start_date):
    try:
        return [
            x
            for x in data_list
            if datetime.strptime(x[last_seen_key].split("T")[0], "%Y-%m-%d").date()
            >= start_date
        ]
    except AttributeError:
        logger.error(
            f"Problem occurred filtering list to recent entries. Returning full list..."
        )
        return data_list


def get_web_components_by_asset(asset):
    query = f"""
    declare query_parameters(asset_name:string = '{asset}');
    EasmAssetWebComponent
    | where AssetName == asset_name
    | where TimeGeneratedValue > ago(24h)
    | where WebComponentLastSeen > ago(30d)
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
        top25 = CVE_LIST.split(",")
        wc["WebComponentCves"] = [
            cve for cve in wc["WebComponentCves"] if cve["Cve"] in top25
        ]

    return data


def get_additional_findings_by_asset(asset):
    thirty_days_ago = date.today() - timedelta(days=30)
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

    data["Ports"] = filter_recent_data(
        data["Ports"], "PortStateLastSeen", thirty_days_ago
    )
    data["Locations"] = filter_recent_data(
        data["Locations"], "LastSeen", thirty_days_ago
    )

    return data
