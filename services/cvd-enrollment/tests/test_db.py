"""Integration tests: need a real ArangoDB.

Set TEST_ARANGO_URL, TEST_ARANGO_USER and TEST_ARANGO_PASS, then run `pytest -m integration`.
Creates and drops a throwaway database.
"""

import pytest

from db import fetch_domain_owners, fetch_domains

pytestmark = pytest.mark.integration


def test_fetch_domains_splits_by_status_and_excludes_archived_and_nxdomain(arango_db):
    domains = arango_db.collection("domains")
    domains.insert_many(
        [
            {"_key": "e", "domain": "e.ca", "cvdEnrollment": {"status": "enrolled"}},
            {"_key": "d", "domain": "d.ca", "cvdEnrollment": {"status": "deny"}},
            {"_key": "n", "domain": "n.ca"},
            {"_key": "a", "domain": "a.ca", "archived": True},
            {"_key": "x", "domain": "x.ca", "rcode": "NXDOMAIN"},
        ]
    )
    all_domains, enrolled, denied = fetch_domains(arango_db)
    assert {d["domain"] for d in all_domains} == {"e.ca", "d.ca", "n.ca"}
    assert [d["domain"] for d in enrolled] == ["e.ca"]
    assert [d["domain"] for d in denied] == ["d.ca"]


def test_fetch_domain_owners_returns_owner_per_domain_in_one_query(arango_db):
    arango_db.collection("domains").insert_many([{"_key": "a"}, {"_key": "b"}, {"_key": "orphan"}])
    arango_db.collection("organizations").insert({"_key": "o", "externalId": "org-a"})
    arango_db.collection("ownership").insert_many(
        [
            {"_from": "organizations/o", "_to": "domains/a"},
            {"_from": "organizations/o", "_to": "domains/b"},
        ]
    )
    owners = fetch_domain_owners(arango_db, ["domains/a", "domains/b", "domains/orphan"])
    assert owners == {"domains/a": "org-a", "domains/b": "org-a"}


def test_fetch_domain_owners_empty_input_returns_empty(arango_db):
    assert fetch_domain_owners(arango_db, []) == {}
