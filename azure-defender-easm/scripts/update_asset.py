from easm_client import client


def update_hosts_with_org_slug_label(domains):
    for domain in domains:
        update_request = {"labels": [domain["orgSlug"]]}
        asset_filter = f"kind = host AND name = {domain.domain}"
        update = client.assets.update(body=update_request, filter=asset_filter)
        print(f'{update["id"]}: {update["state"]}')


def update_hosts_with_external_id(domains):
    for domain in domains:
        update_request = {"externalId": [domain["id"]]}
        asset_filter = "kind = host AND name = " + domain["domain"]
        update = client.assets.update(body=update_request, filter=asset_filter)
        print(f'{update["id"]}: {update["state"]}')


def label_assets(assets, label):
    update_ids = []
    for asset in assets:
        update_request = {"labels": asset["labels"].append(label)}
        asset_filter = f"kind = {asset['kind']} AND name = {asset['name']}"
        update = client.assets.update(body=update_request, filter=asset_filter)
        update_ids.append(update["id"])

    # Using the `tasks` client, we can view the progress of each update using the `get` method
    for update_id in update_ids:
        update = client.tasks.get(update_id)
        print(f'{update["id"]}: {update["state"]}')
