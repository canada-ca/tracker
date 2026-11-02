import pytest

from tests.conftest import make_domain, make_h1_asset
from sync import archive, create_assets, rescope_assets

OK_ASSET = {"data": {"id": "h1-1"}}
TAGS = [{"name": "org-a", "id": "7"}]


def enrolled(name="a.ca"):
    return make_domain(name, "enrolled")


def owners_for(*names, org="org-a"):
    return {f"domains/{n}": org for n in names}


@pytest.fixture
def h1_creates_ok(h1_server):
    h1_server.respond("POST", "/assets/h1-1/scopes", 201, {"data": {}})
    h1_server.respond("POST", "/assets", 201, OK_ASSET)
    return h1_server


def test_create_assets_creates_asset_then_scope(h1_creates_ok):
    assert create_assets(h1_creates_ok.settings, [enrolled()], TAGS, owners_for("a.ca")) == (1, 0)
    asset_body = h1_creates_ok.calls("POST", "/assets")[0]
    assert asset_body["data"]["attributes"]["identifier"] == "a.ca"
    assert asset_body["data"]["relationships"]["asset_tags"]["data"] == [{"id": 7}]
    scope_body = h1_creates_ok.calls("POST", "/scopes")[0]
    assert scope_body["data"]["attributes"]["eligible_for_submission"] is True


def test_create_failure_counts_failure_and_continues(h1_server):
    h1_server.respond("POST", "/assets", 500, {"errors": [{"title": "boom"}]})
    result = create_assets(h1_server.settings, [enrolled("a.ca"), enrolled("b.ca")], TAGS, owners_for("a.ca", "b.ca"))
    assert result == (0, 2)
    assert len(h1_server.calls("POST", "/assets")) == 2


def test_missing_owner_counts_failure_without_calling_h1(h1_server, caplog):
    assert create_assets(h1_server.settings, [enrolled()], TAGS, {}) == (0, 1)
    assert h1_server.requests == []
    assert "No owner organization found for a.ca" in caplog.text


def test_missing_tag_counts_failure_and_continues(h1_creates_ok, caplog):
    owners = {"domains/a.ca": "unknown-org", "domains/b.ca": "org-a"}
    result = create_assets(h1_creates_ok.settings, [enrolled("a.ca"), enrolled("b.ca")], TAGS, owners)
    assert result == (1, 1)
    assert "No asset tag found for org unknown-org" in caplog.text


def test_rescope_updates_scope_of_existing_asset(h1_server):
    h1_server.respond("GET", "/assets/h1-a/scopes", 200, {"data": [{"id": "s1"}]})
    h1_server.respond("PUT", "/assets/h1-a/scopes/s1", 200, {"data": {}})
    assert rescope_assets(h1_server.settings, ["a.ca"], "deny", {"a.ca": "h1-a"}) == (1, 0)
    body = h1_server.calls("PUT", "/scopes/s1")[0]
    assert body["data"]["attributes"]["eligible_for_submission"] is False


@pytest.mark.parametrize(
    "scope_response, asset_ids",
    [
        pytest.param(None, {}, id="no_asset_id"),
        pytest.param((200, {"data": []}), {"a.ca": "h1-a"}, id="no_scope_entry"),
        pytest.param((500, {"errors": []}), {"a.ca": "h1-a"}, id="scope_fetch_fails"),
    ],
)
def test_rescope_failures_are_counted(h1_server, scope_response, asset_ids):
    if scope_response:
        h1_server.respond("GET", "/scopes", *scope_response)
    assert rescope_assets(h1_server.settings, ["a.ca"], "enrolled", asset_ids) == (0, 1)


def test_archive_posts_assets(h1_server):
    h1_server.respond("POST", "/assets/archive", 200, {"data": {}})
    assert archive(h1_server.settings, [make_h1_asset("a.ca")]) is True
    assert h1_server.calls("POST", "/archive")[0]["data"][0]["id"] == "asset-a.ca"


def test_archive_failure_returns_false(h1_server):
    h1_server.respond("POST", "/assets/archive", 500, {"errors": [{"title": "x"}]})
    assert archive(h1_server.settings, [make_h1_asset("a.ca")]) is False
