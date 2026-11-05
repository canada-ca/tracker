"""HackerOne asset tag lookups."""

from hackerone import HackerOneSettings, get_asset_tags

# Upper bound on tag pages fetched; prevents an infinite pagination loop.
TAG_PAGE_LIMIT = 10


def tag_is_gc_org_id(asset_tag: dict) -> bool:
    """Return True when the tag belongs to the "GC Org ID" tag category."""
    category = asset_tag["relationships"]["asset_tag_category"]["data"]
    return category["attributes"]["name"] == "GC Org ID"


def get_gc_orgid_tags(settings: HackerOneSettings) -> list[dict]:
    """Fetch GC Org ID tags as [{"name": ..., "id": ...}], paging until empty or TAG_PAGE_LIMIT pages."""
    gc_org_id_tags = []

    for page_number in range(1, TAG_PAGE_LIMIT + 1):
        page = get_asset_tags(settings, page_number=page_number, page_size=100).get("data", [])
        if not page:
            break
        gc_org_id_tags += [tag for tag in page if tag_is_gc_org_id(tag)]

    return [{"name": tag["attributes"]["name"], "id": tag["id"]} for tag in gc_org_id_tags]
