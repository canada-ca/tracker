import pytest
from unittest.mock import MagicMock


def make_h1_asset(identifier: str, asset_id: str = None) -> dict:
    """Build a minimal HackerOne asset dict as returned by the API."""
    return {"id": asset_id or f"asset-{identifier}", "attributes": {"identifier": identifier}}


def make_domain(domain: str, cvd_status: str = None) -> dict:
    """Build a minimal domain dict as returned from ArangoDB."""
    d = {"_id": f"domains/{domain}", "domain": domain}
    if cvd_status is not None:
        d["cvdEnrollment"] = {"status": cvd_status}
    return d


def make_asset_tag(name: str, tag_id: int = 1) -> dict:
    """Build a minimal asset tag as produced by get_gc_orgid_tags."""
    return {"name": name, "id": tag_id}


def make_mock_db(domains: list) -> MagicMock:
    """Return a mock ArangoDB StandardDatabase whose AQL cursor yields the given domains."""
    db = MagicMock()
    db.aql.execute.return_value = iter(domains)
    return db
