from easm_client import EASM_CLIENT


def run_disco_group(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        EASM_CLIENT.discovery_groups.run(group_name)


def list_disco_group_runs(group_name):
    org_disco_group = get_disco_group(group_name)
    if org_disco_group:
        return EASM_CLIENT.discovery_groups.list_runs(group_name)


def get_disco_group(group_name):
    disco_group = EASM_CLIENT.discovery_groups.get(group_name)
    return disco_group


def create_disco_group(name, assets, frequency=0):
    request = {
        "description": "Discovery group made for discovering assets for " + name,
        "seeds": assets,
        "frequencyMilliseconds": frequency,
    }
    response = EASM_CLIENT.discovery_groups.put(name, request)
    return response


def delete_disco_group(group_name):
    EASM_CLIENT.discovery_groups.delete(group_name)


def list_disco_groups():
    for dg in EASM_CLIENT.discovery_groups.list():
        print(f'{dg["id"]}: {dg["name"]}')
