import pytest

from tags import TAG_PAGE_LIMIT, get_gc_orgid_tags, tag_is_gc_org_id


def make_tag(tag_id: str, name: str, category: str = "GC Org ID") -> dict:
    return {
        "id": tag_id,
        "attributes": {"name": name},
        "relationships": {"asset_tag_category": {"data": {"attributes": {"name": category}}}},
    }


@pytest.mark.parametrize(
    "category, expected", [("GC Org ID", True), ("Environment", False)], ids=["gc", "other"]
)
def test_tag_is_gc_org_id(category, expected):
    assert tag_is_gc_org_id(make_tag("1", "x", category)) is expected


def test_collects_gc_org_tags_across_pages_and_filters_others(h1_server):
    h1_server.respond("GET", "page[number]=1", 200, {"data": [make_tag("1", "org-a"), make_tag("2", "env", "Env")]})
    h1_server.respond("GET", "page[number]=2", 200, {"data": [make_tag("3", "org-b")]})
    h1_server.respond("GET", "page[number]=3", 200, {"data": []})
    assert get_gc_orgid_tags(h1_server.settings) == [{"name": "org-a", "id": "1"}, {"name": "org-b", "id": "3"}]


def test_stops_after_processing_page_limit(h1_server):
    # Regression: the loop broke on reaching TAG_PAGE_LIMIT before processing
    # that page, so the tags on page TAG_PAGE_LIMIT were silently dropped.
    for page in range(1, TAG_PAGE_LIMIT + 2):
        h1_server.respond("GET", f"page[number]={page}", 200, {"data": [make_tag(str(page), f"org-{page}")]})
    result = get_gc_orgid_tags(h1_server.settings)
    assert len(h1_server.calls("GET", "asset_tags")) == TAG_PAGE_LIMIT
    assert result[-1] == {"name": f"org-{TAG_PAGE_LIMIT}", "id": str(TAG_PAGE_LIMIT)}
    assert len(result) == TAG_PAGE_LIMIT
