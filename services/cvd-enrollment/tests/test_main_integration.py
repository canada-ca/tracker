"""Integration tests: main() against real ArangoDB plus a fake HackerOne server.

Set TEST_ARANGO_URL, TEST_ARANGO_USER and TEST_ARANGO_PASS, then run `pytest -m integration`.
"""

import logging

import pytest

import main as main_module
from tests.conftest import make_config, make_h1_asset, make_tag_page

pytestmark = pytest.mark.integration


def seed_domain(db, key: str, status: str | None = None, owner_key: str | None = None) -> None:
    """Insert domain `key` (name `<key>.ca`), optionally owned by organization `owner_key`."""
    doc = {"_key": key, "domain": f"{key}.ca"}
    if status:
        doc["cvdEnrollment"] = {"status": status}
    db.collection("domains").insert(doc)
    if owner_key:
        db.collection("ownership").insert({"_from": f"organizations/{owner_key}", "_to": f"domains/{key}"})


@pytest.fixture
def owned_db(arango_db):
    """arango_db holding organization `org-a` (externalId "org-a")."""
    arango_db.collection("organizations").insert({"_key": "org-a", "externalId": "org-a"})
    return arango_db


def test_main_syncs_every_change_kind(owned_db, h1_server):
    seed_domain(owned_db, "new", "enrolled", owner_key="org-a")
    seed_domain(owned_db, "blocked", "deny", owner_key="org-a")
    seed_domain(owned_db, "back", "enrolled")
    seed_domain(owned_db, "out", "deny")
    seed_domain(owned_db, "old")
    old_asset = make_h1_asset("old.ca", "h1-old")
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": [make_h1_asset("out.ca", "h1-out"), old_asset]})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": [make_h1_asset("back.ca", "h1-back")]})
    h1_server.respond("GET", "/assets/h1-back/scopes", 200, {"data": [{"id": "s-back"}]})
    h1_server.respond("GET", "/assets/h1-out/scopes", 200, {"data": [{"id": "s-out"}]})
    h1_server.respond("PUT", "/scopes/", 200, {"data": {}})
    h1_server.respond("POST", "/assets", 201, {"data": {"id": "h1-created"}})
    h1_server.respond("POST", "/assets/h1-created/scopes", 201, {"data": {}})
    h1_server.respond("POST", "/assets/archive", 200, {"data": {}})
    make_tag_page(h1_server, tag_id="7", name="org-a")

    main_module.main(owned_db, make_config(h1_server))

    created_assets = [
        r.body for r in h1_server.received if r.method == "POST" and r.path == "/v1/organizations/org/assets"
    ]
    assert sorted(b["data"]["attributes"]["identifier"] for b in created_assets) == ["blocked.ca", "new.ca"]
    assert all(b["data"]["relationships"]["asset_tags"]["data"] == [{"id": 7}] for b in created_assets)
    eligibility = {
        r.path.rsplit("/", 1)[-1]: r.body["data"]["attributes"]["eligible_for_submission"]
        for r in h1_server.received
        if r.method == "PUT"
    }
    assert eligibility == {"s-back": True, "s-out": False}
    assert h1_server.calls("POST", "/assets/archive") == [{"data": [old_asset]}]


def test_main_aborts_when_db_query_fails(arango_db, h1_server, caplog):
    arango_db.delete_collection("domains")
    main_module.main(arango_db, make_config(h1_server))
    assert "Error(s) while fetching domains from DB" in caplog.text
    assert h1_server.received == []


def test_main_aborts_when_in_scope_fetch_fails(owned_db, h1_server, caplog):
    seed_domain(owned_db, "a", "enrolled", owner_key="org-a")
    h1_server.respond("GET", "coverage]=in_scope", 500, {"errors": [{"title": "x"}]})
    main_module.main(owned_db, make_config(h1_server))
    assert "Error(s) while fetching H1 assets" in caplog.text
    assert h1_server.calls("POST", "/assets") == []


def test_main_archives_when_nothing_enrolled(owned_db, h1_server):
    seed_domain(owned_db, "old")
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": [make_h1_asset("old.ca")]})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": []})
    h1_server.respond("POST", "/assets/archive", 200, {"data": {}})
    main_module.main(owned_db, make_config(h1_server))
    assert len(h1_server.calls("POST", "/archive")) == 1


def test_main_warns_and_skips_creation_when_domain_has_no_owner(owned_db, h1_server, caplog):
    caplog.set_level(logging.WARNING)
    seed_domain(owned_db, "new", "enrolled")
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": []})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": []})
    make_tag_page(h1_server, tag_id="7", name="org-a")
    main_module.main(owned_db, make_config(h1_server))
    assert "1/1 enrolled asset creations failed" in caplog.text
    assert h1_server.calls("POST", "/assets") == []
