from easm_client import client
from discover_assets import list_disco_group_runs


def get_login_pages():
    login_pages = []
    for asset in client.assets.list(
        filter="kind = page AND (url ~ /login OR url ~ /log-in OR url ~ /signin OR url ~ /sign-in) AND url !~ api.canada.ca",
    ):
        # print asset if it has a login page
        if ".gc.ca" in asset["name"] or ".canada.ca" in asset["name"]:
            print(asset["name"])
            login_pages.append(asset)

    return login_pages


def get_register_pages():
    register_pages = []
    for asset in client.assets.list(
        filter="kind = page AND (url ~/register OR url ~/signup OR url ~/sign-up) AND url !~ api.canada.ca",
    ):
        # print asset if it has a login page
        if ".gc.ca" in asset["name"] or ".canada.ca" in asset["name"]:
            print(asset["name"])
            register_pages.append(asset)

    return register_pages


def get_web_components(asset):
    return asset["asset"]["webComponents"]


def get_cookies(asset):
    return asset["asset"]["cookies"]


def enumerate_attributes_types():
    type_enums = set()
    for asset in client.assets.list(filter="kind = page AND state = confirmed"):
        length = len(type_enums)
        try:
            attributes = asset["asset"]["attributes"]
            for attribute in attributes:
                type_enums.add(attribute["attributeType"])
        except KeyError:
            pass

        if len(type_enums) > length:
            print(type_enums)

    return type_enums


def enumerate_wc_types():
    type_enums = set()
    for asset in client.assets.list(filter="kind = host AND state = confirmed"):
        length = len(type_enums)
        try:
            web_components = asset["asset"]["webComponents"]
            for wc in web_components:
                type_enums.add(wc["type"])
        except KeyError:
            pass

        if len(type_enums) > length:
            print(type_enums)

    return type_enums


def find_gc_hosts():
    assets = []
    for asset in client.assets.list(
        filter="kind = host AND state = confirmed AND wildcard = false",
    ):
        if ".gc.ca" in asset["name"] or ".canada.ca" in asset["name"]:
            print(asset["name"])
            assets.append(asset)
    return assets


def find_disco_group_assets(group_name):
    group_runs = list_disco_group_runs(group_name)

    # sort by most recent run
    group_runs = sorted(group_runs, key=lambda k: k["submittedDate"], reverse=True)
    latest_run = group_runs[0]
    print(f"Latest run: {latest_run}")

    assets = []
    for asset in client.assets.list(
        filter=f"kind = host AND state = confirmed AND wildcard = false",
    ):
        print(asset["name"])
        assets.append(asset)
    return assets


if __name__ == "__main__":
    find_disco_group_assets("Elections")
