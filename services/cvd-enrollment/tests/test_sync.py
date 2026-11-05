import pytest

from tests.conftest import make_domain, make_h1_asset
from sync import Changes, asset_id_by_identifier, compute_changes

NO_CHANGES = Changes((), (), (), (), ())


def names(docs):
    return [d["domain"] for d in docs]


CASES = [
    pytest.param(
        dict(all=["a.ca"], enrolled=["a.ca"]),
        dict(new_enrolled=["a.ca"]),
        id="new_enrolled",
    ),
    pytest.param(
        dict(all=["a.ca"], denied=["a.ca"]),
        dict(new_denied=["a.ca"]),
        id="new_denied",
    ),
    pytest.param(
        dict(all=["a.ca"], enrolled=["a.ca"], out=["a.ca"]),
        dict(rescope_to_enrolled=["a.ca"]),
        id="deny_to_enrolled",
    ),
    pytest.param(
        dict(all=["a.ca"], denied=["a.ca"], inn=["a.ca"]),
        dict(rescope_to_denied=["a.ca"]),
        id="enrolled_to_deny",
    ),
    pytest.param(
        dict(all=["a.ca"], inn=["a.ca"]),
        dict(archive=["a.ca"]),
        id="archive_in_scope_asset_no_longer_enrolled_or_denied",
    ),
    pytest.param(
        dict(all=[], inn=["gone.ca"]),
        {},
        id="no_archive_when_domain_not_in_db",
    ),
    pytest.param(
        dict(all=["a.ca"], enrolled=["a.ca"], inn=["a.ca"]),
        {},
        id="no_changes_already_in_sync",
    ),
    pytest.param(
        dict(all=["a.ca"], denied=["a.ca"], out=["a.ca"]),
        {},
        id="no_changes_denied_already_out_of_scope",
    ),
]


@pytest.mark.parametrize("given, expected", CASES)
def test_compute_changes(given, expected):
    changes = compute_changes(
        all_domains=[make_domain(n) for n in given.get("all", [])],
        enrolled=[make_domain(n, "enrolled") for n in given.get("enrolled", [])],
        denied=[make_domain(n, "deny") for n in given.get("denied", [])],
        in_scope_assets=[make_h1_asset(n) for n in given.get("inn", [])],
        out_of_scope_assets=[make_h1_asset(n) for n in given.get("out", [])],
    )
    assert names(changes.new_enrolled) == expected.get("new_enrolled", [])
    assert names(changes.new_denied) == expected.get("new_denied", [])
    assert list(changes.rescope_to_enrolled) == expected.get("rescope_to_enrolled", [])
    assert list(changes.rescope_to_denied) == expected.get("rescope_to_denied", [])
    assert [a["attributes"]["identifier"] for a in changes.to_archive] == expected.get("archive", [])


def test_no_inputs_yields_no_changes():
    assert compute_changes([], [], [], [], []) == NO_CHANGES


@pytest.mark.parametrize(
    "asset",
    [{"id": "1"}, {"id": "1", "attributes": None}, make_h1_asset(None), make_h1_asset("")],
    ids=["no_attributes", "attributes_none", "identifier_none", "identifier_empty"],
)
def test_assets_without_identifier_are_ignored(asset):
    changes = compute_changes([make_domain("a.ca")], [], [], [asset], [asset])
    assert changes == NO_CHANGES


def test_domains_without_name_are_ignored():
    nameless = {"_id": "domains/x", "domain": None}
    changes = compute_changes([nameless], [nameless], [nameless], [make_h1_asset(None)], [])
    assert changes == NO_CHANGES


def test_asset_id_by_identifier_skips_missing_identifiers():
    assets = [make_h1_asset("a.ca", "1"), make_h1_asset(None, "2"), {"id": "3"}]
    assert asset_id_by_identifier(assets) == {"a.ca": "1"}
