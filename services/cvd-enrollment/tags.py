"""HackerOne asset tag lookups."""

from hackerone import get_asset_tags

# Upper bound on tag pages fetched; prevents an infinite pagination loop.
TAG_PAGE_LIMIT = 10


def tag_is_gc_org_id(asset_tag: dict) -> bool:
    """Return True when the tag belongs to the "GC Org ID" tag category."""
    category = asset_tag["relationships"]["asset_tag_category"]["data"]
    return category["attributes"]["name"] == "GC Org ID"


def get_gc_orgid_tags() -> list[dict]:
    """Fetch all GC Org ID tags as [{"name": ..., "id": ...}], paging until empty."""
    current_page = 1
    gc_org_id_tags = []

    while True:
        res = get_asset_tags(page_number=current_page, page_size=100)
        if len(res.get("data", [])) == 0 or current_page == TAG_PAGE_LIMIT:
            break
        gc_org_id_tags += [tag for tag in res["data"] if tag_is_gc_org_id(tag)]
        current_page += 1

    return [{"name": tag["attributes"]["name"], "id": tag["id"]} for tag in gc_org_id_tags]
