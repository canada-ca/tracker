import logging

import pytest

import main as main_module
from config import Config
from tests.conftest import make_domain, make_h1_asset

CONFIG = Config.from_env({"SERVICE_ACCOUNT_EMAIL": "ops@example.ca"})


class FakeCursor(list):
    """AQL result: iterable of rows."""


class FakeAql:
    def __init__(self, domains, owners):
        self.domains, self.owners = domains, owners

    def execute(self, query, bind_vars=None):
        if "FOR d IN domains" in query:
            return FakeCursor(self.domains)
        ids = bind_vars["domain_ids"]
        return FakeCursor({"domain_id": i, "owner": self.owners[i]} for i in ids if i in self.owners)


class FakeDb:
    """Hand-written stand-in for the two AQL queries main issues."""

    def __init__(self, domains, owners=None):
        self.aql = FakeAql(domains, owners or {})


@pytest.fixture
def sent(monkeypatch):
    """Capture notifications instead of calling GC Notify."""
    calls = []
    monkeypatch.setattr(
        main_module,
        "send_enrollment_notification",
        lambda email, enrolled_domains: calls.append((email, enrolled_domains)),
    )
    return calls


def tag_page(server):
    tag = {
        "id": "7",
        "attributes": {"name": "org-a"},
        "relationships": {"asset_tag_category": {"data": {"attributes": {"name": "GC Org ID"}}}},
    }
    server.respond("GET", "page[number]=1", 200, {"data": [tag]})
    server.respond("GET", "page[number]=2", 200, {"data": []})


def test_fetch_h1_assets_degrades_when_out_of_scope_fails(h1_server, caplog):
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": [make_h1_asset("a.ca")]})
    h1_server.respond("GET", "coverage]=out_of_scope", 500, {"errors": [{"title": "x"}]})
    in_scope, out_of_scope = main_module.fetch_h1_assets()
    assert [a["id"] for a in in_scope] == ["asset-a.ca"]
    assert out_of_scope == []
    assert "rescope detection will be skipped" in caplog.text


def test_main_aborts_when_in_scope_fetch_fails(h1_server, sent, caplog):
    h1_server.respond("GET", "coverage]=in_scope", 500, {"errors": [{"title": "x"}]})
    main_module.main(FakeDb([make_domain("a.ca", "enrolled")]), CONFIG)
    assert "Error(s) while fetching H1 assets" in caplog.text
    assert h1_server.calls("POST", "/assets") == []
    assert sent == []


def test_main_aborts_when_db_fails(sent, caplog):
    class BrokenDb:
        class aql:
            @staticmethod
            def execute(*args, **kwargs):
                raise RuntimeError("db down")

    main_module.main(BrokenDb(), CONFIG)
    assert "Error(s) while fetching domains from DB: db down" in caplog.text
    assert sent == []


def test_main_notifies_new_and_rescoped_enrolled_domains(h1_server, sent):
    # Regression: the notification list mixed new-asset dicts with rescoped
    # domain names (str) and indexed the str as a dict, crashing main.
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": []})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": [make_h1_asset("back.ca", "h1-back")]})
    h1_server.respond("GET", "/assets/h1-back/scopes", 200, {"data": [{"id": "s1"}]})
    h1_server.respond("PUT", "/assets/h1-back/scopes/s1", 200, {"data": {}})
    h1_server.respond("POST", "/assets/h1-new/scopes", 201, {"data": {}})
    h1_server.respond("POST", "/assets", 201, {"data": {"id": "h1-new"}})
    tag_page(h1_server)
    db = FakeDb(
        [make_domain("new.ca", "enrolled"), make_domain("back.ca", "enrolled")],
        owners={"domains/new.ca": "org-a"},
    )

    main_module.main(db, CONFIG)

    assert sent == [("ops@example.ca", ["new.ca", "back.ca"])]
    assert len(h1_server.calls("PUT", "/scopes/s1")) == 1


def test_main_archives_and_skips_notification_when_nothing_enrolled(h1_server, sent):
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": [make_h1_asset("old.ca")]})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": []})
    h1_server.respond("POST", "/assets/archive", 200, {"data": {}})
    main_module.main(FakeDb([make_domain("old.ca")]), CONFIG)
    assert len(h1_server.calls("POST", "/archive")) == 1
    assert sent == []


def test_main_survives_missing_owner_and_warns(h1_server, sent, caplog):
    caplog.set_level(logging.WARNING)
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": []})
    h1_server.respond("GET", "coverage]=out_of_scope", 200, {"data": []})
    tag_page(h1_server)
    main_module.main(FakeDb([make_domain("new.ca", "enrolled")]), CONFIG)
    assert "1/1 enrolled asset creations failed" in caplog.text
    assert h1_server.calls("POST", "/assets") == []
