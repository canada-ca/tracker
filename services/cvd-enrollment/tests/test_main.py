"""Unit tests for main that need no database; see test_main_integration.py for the rest."""

import main as main_module
from tests.conftest import make_h1_asset


def test_fetch_h1_assets_degrades_when_out_of_scope_fails(h1_server, caplog):
    h1_server.respond("GET", "coverage]=in_scope", 200, {"data": [make_h1_asset("a.ca")]})
    h1_server.respond("GET", "coverage]=out_of_scope", 500, {"errors": [{"title": "x"}]})
    in_scope, out_of_scope = main_module.fetch_h1_assets(h1_server.settings)
    assert [a["id"] for a in in_scope] == ["asset-a.ca"]
    assert out_of_scope == []
    assert "rescope detection will be skipped" in caplog.text
