from easm_client import EASM_CLIENT
from kusto_client import KUSTO_CLIENT, KUSTO_DATABASE
from azure.kusto.data.helpers import dataframe_from_result_table


def get_labelled_assets_with_root(root, label):
    query = f"""
    declare query_parameters(root:string = '{root}', label:string = '{label}');
    EasmAsset
    | where AssetName == root or AssetName endswith '.' + root
    | where Labels has label
    | summarize by AssetName, AssetUuid, Labels
    """
    response = KUSTO_CLIENT.execute(KUSTO_DATABASE, query)
    data = dataframe_from_result_table(response.primary_results[0]).to_dict(
        orient="records"
    )
    return data


def switch_org_label_for_root(root, old_label, new_label):
    # Get assets with old label
    assets = get_labelled_assets_with_root(root, old_label)
    # Remove old label
    print("Removing old label")
    for asset in assets:
        update_request = {"labels": {f"{old_label}": False}}
        asset_filter = f"uuid = {asset['uuid']}"
        update = EASM_CLIENT.assets.update(body=update_request, filter=asset_filter)
        print(f'{update["id"]}: {update["state"]}')
    # Add new label
    print("Adding new label")
    for asset in assets:
        update_request = {"labels": {f"{new_label}": True}}
        asset_filter = f"uuid = {asset['uuid']}"
        update = EASM_CLIENT.assets.update(body=update_request, filter=asset_filter)
        print(f'{update["id"]}: {update["state"]}')


if __name__ == "__main__":
    switch_org_label_for_root()
