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

        componentVersions = wc["WebComponentVersion"].split(".", 2)
        # Assign confidence levels to each CVE
        for cve in wc["WebComponentCves"]:
            print(cve["Cve"])
            # if detected version includes patch, high confidence
            if len(componentVersions) == 3:
                cve["ConfidenceLevel"] = "high"
            else:
                # fetch affected versions of CVE
                affected_versions = fetch_cve_affected_versions(
                    cve["Cve"], wc["WebComponentName"]
                )
                for cpe in affected_versions:
                    version_range = get_version_range(cpe)
                    print(version_range)
                    # compare minor and major version nums
                    if len(componentVersions) == 2:
                        _, minor = componentVersions
                        # if int(minor)
                    elif len(componentVersions) == 1:
                        pass

    return data


def fetch_cve_affected_versions(cve, comp_name):
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve}"
    try:
        res = requests.get(url)
        # Check if the response is successful
        if res.status_code == 200:
            data = res.json()
            found = []
            configurations = data["vulnerabilities"][0]["cve"]["configurations"]
            for item in configurations:
                for node in item["nodes"]:
                    for cpe in node["cpeMatch"]:
                        if cpe["criteria"].find(comp_name.lower()) != -1:
                            found.append(cpe)
            return found
        else:
            return None
    except Exception as e:
        print("Error:", e)
        return None


def get_version_range(affected_versions):
    versions = {"start": None, "end": None}

    for key, inclusive in [
        ("versionStartExcluding", False),
        ("versionStartIncluding", True),
    ]:
        if affected_versions.get(key):
            versions["start"] = {
                "version": affected_versions[key],
                "inclusive": inclusive,
            }
            break

    for key, inclusive in [
        ("versionEndExcluding", False),
        ("versionEndIncluding", True),
    ]:
        if affected_versions.get(key):
            versions["end"] = {
                "version": affected_versions[key],
                "inclusive": inclusive,
            }
            break

    return versions


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
