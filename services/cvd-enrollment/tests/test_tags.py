import pytest

import tags
from tags import get_gc_orgid_tags, tag_is_gc_org_id


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
    assert get_gc_orgid_tags() == [{"name": "org-a", "id": "1"}, {"name": "org-b", "id": "3"}]


def test_stops_at_page_limit(h1_server, monkeypatch):
    monkeypatch.setattr(tags, "TAG_PAGE_LIMIT", 3)
    h1_server.respond("GET", "asset_tags", 200, {"data": [make_tag("1", "org-a")]})
    get_gc_orgid_tags()
    assert len(h1_server.calls("GET", "asset_tags")) == 3
