from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table
from datetime import datetime, date, timedelta
import logging
import os
import requests
import time
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
            if (
                # There are some strange entries such as port '-1' which don't have a last seen date. Skip these.
                x[last_seen_key]
                and datetime.strptime(x[last_seen_key].split("T")[0], "%Y-%m-%d").date()
                >= start_date
            )
        ]
    except AttributeError as e:
        logger.error(
            f"Problem occurred filtering list to recent entries. Returning full list... Error: {e}"
        )
        return data_list


def get_web_components_by_asset(asset, fetched_cves):
    query = f"""
    declare query_parameters(asset_name:string = '{asset}');
    EasmAssetWebComponent
    | where AssetName == asset_name
    | where TimeGeneratedValue > ago(30d)
    | where WebComponentLastSeen > ago(30d)
    | summarize max_time = max(TimeGeneratedValue) by AssetName
    | join kind=inner (
        EasmAssetWebComponent
        | where AssetName == asset_name
        | where TimeGeneratedValue > ago(30d)
        | where WebComponentLastSeen > ago(30d)
    ) on $left.max_time == $right.TimeGeneratedValue
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

        component_versions = wc["WebComponentVersion"].split(".", 2)
        # Assign confidence levels to each CVE
        for cve in wc["WebComponentCves"]:
            cve["ConfidenceLevel"] = "unknown"
            # if detected version includes patch, high confidence
            if len(component_versions) == 3:
                cve["ConfidenceLevel"] = "high"
            else:
                # fetch affected versions of CVE
                affected_versions = fetch_cve_affected_versions(
                    cve["Cve"], wc["WebComponentName"], fetched_cves
                )
                for cpe in affected_versions:
                    try:
                        start, end = get_version_range(cpe).values()
                        # compare minor and major version nums
                        if len(component_versions) == 2:
                            major = int(component_versions[0])
                            minor = int(component_versions[1])
                            if start is not None:
                                if major < int(start.split(".")[0]):
                                    continue
                            if major > int(end.split(".")[0]):
                                continue

                            if minor < int(end.split(".")[1]):
                                cve["ConfidenceLevel"] = "high"
                            elif minor == int(end.split(".")[1]):
                                cve["ConfidenceLevel"] = "medium"
                        elif len(component_versions) == 1:
                            major = int(component_versions[0])
                            if start is not None:
                                if major < int(start.split(".")[0]):
                                    continue
                            if major < int(end.split(".")[0]):
                                cve["ConfidenceLevel"] = "high"
                            elif major == int(end.split(".")[0]):
                                cve["ConfidenceLevel"] = "low"
                    except Exception as e:
                        logger.error(
                            f"Encountered problem while assigning confidence level for {cve['Cve']} on {asset}: {e}"
                        )
                        continue

    return data


def fetch_cve_affected_versions(cve, comp_name, fetched_cves):
    try:
        return fetched_cves[cve]
    except KeyError:
        logger.info(f"Data on {cve} has not been fetched yet. Attempting to fetch it.")

    res = {"status_code": 0}
    attempts = 1
    while attempts <= 3:
        try:
            res = requests.get(
                f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve}"
            )
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
                fetched_cves[cve] = found
                return found
            else:
                time.sleep(60)
                attempts += 1
        except Exception as e:
            logger.error(f"Encountered problem while fetching cves for {cve}: {e}")
            return None

    # Unable to fetch CVE data
    logger.error(f"Unable to fetch data for CVE: {cve}")
    fetched_cves[cve] = None
    return None


def get_version_range(affected_versions):
    versions = {"start": None, "end": None}

    for key in ["versionStartExcluding", "versionStartIncluding"]:
        if affected_versions.get(key):
            versions["start"] = affected_versions[key]
            break

    for key in ["versionEndExcluding", "versionEndIncluding"]:
        if affected_versions.get(key):
            versions["end"] = affected_versions[key]
            break

    return versions


def get_additional_findings_by_asset(asset):
    thirty_days_ago = date.today() - timedelta(days=30)
    query = f"""
    declare query_parameters(asset_name:string = '{asset}');
    EasmHostAsset
    | where AssetName == asset_name
    | where TimeGeneratedValue > ago(30d)
    | order by TimeGeneratedValue desc
    | limit 1
    | project Locations, Ports, Headers
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    result_list = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )

    findings = {
        "Locations": [],
        "Ports": [],
        "Headers": [],
    }

    if len(result_list) == 0:
        return findings

    data = result_list[0]

    findings["Ports"] = filter_recent_data(
        data["Ports"], "PortStateLastSeen", thirty_days_ago
    )
    findings["Locations"] = filter_recent_data(
        data["Locations"], "LastSeen", thirty_days_ago
    )

    findings["Headers"] = data["Headers"]

    return findings
