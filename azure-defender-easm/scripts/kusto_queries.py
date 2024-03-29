from kusto_client import KUSTO_CLIENT, KUSTO_DATABASE
from azure.kusto.data.helpers import dataframe_from_result_table


def get_host_asset(host_name):
    query = f"""
    declare query_parameters(hostName:string = '{host_name}');
    EasmHostAsset
    | where Host == hostName
    | limit 1
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_page_asset(page_name):
    query = f"""
    declare query_parameters(pageName:string = '{page_name}');
    EasmPageAsset
    | where Host == pageName
    | take 1
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_host_assets():
    query = """
    EasmAsset
    | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca'
    | where AssetType == 'HOST'
    | summarize by AssetName, AssetUuid
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def get_host_assets_by_labels(label):
    query = f"""
    declare query_parameters(label:string = '{label}');
    EasmAsset
    | where AssetName endswith '.gc.ca' or AssetName endswith '.canada.ca'
    | where AssetType == 'HOST'
    | where Labels has label
    | summarize by AssetName, AssetUuid, Labels
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


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
    declare query_parameters(domain:string = '{domain}');
    EasmHostAsset
    | where AssetName == domain
    | where WebComponents has 'DDOS Protection'
    | project AssetName
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return len(data) > 0


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
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data
