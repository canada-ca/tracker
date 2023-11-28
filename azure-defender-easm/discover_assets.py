from easm_client import client
import json


def run_disco_group(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        client.discovery_groups.run(group_name)


def list_disco_group_runs(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        return client.discovery_groups.list_runs(group_name)


# takes org slug as input, creates disco group with org slug as
def create_org_disco_groups(filepath):
    with open(filepath) as f:
        orgAssetSeeds = json.load(f)
    for k, v in orgAssetSeeds.items():
        print(f"Creating disco group for {k}")
        res = create_disco_group(k, v)
        print(res)


def get_disco_group(group_name):
    disco_group = client.discovery_groups.get(group_name)
    return disco_group


def create_disco_group(name, assets):
    request = {
        "description": "Discovery group made for discovering assets for " + name,
        "seeds": assets,
    }
    response = client.discovery_groups.put(name, request)
    return response


def delete_disco_group(group_name):
    client.discovery_groups.delete(group_name)


def list_disco_groups():
    for dg in client.discovery_groups.list():
        print(f'{dg["id"]}: {dg["name"]}')
