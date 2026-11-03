"""HackerOne API client. Every call takes the HackerOneSettings it should use."""

import logging
from dataclasses import dataclass
from typing import TypedDict

import requests
from requests import Response
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Production HackerOne API; used when H1_BASE_URL is not set.
DEFAULT_BASE_URL = "https://api.hackerone.com/v1"
# Headers sent with every request.
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HackerOneSettings:
    """Connection and program identifiers for one HackerOne organization.

    Credentials and ids may be None when unset in the environment; requests
    made with them are then rejected by HackerOne.
    """

    org_id: str | None
    program_id: str | None
    username: str | None
    token: str | None
    base_url: str = DEFAULT_BASE_URL

    @property
    def assets_url(self) -> str:
        """URL of the organization's asset collection."""
        return f"{self.base_url}/organizations/{self.org_id}/assets"

    @property
    def asset_tags_url(self) -> str:
        """URL of the organization's asset tag collection."""
        return f"{self.base_url}/organizations/{self.org_id}/asset_tags"


class HackerOneAPIError(Exception):
    """Raised when HackerOne is unreachable or answers with an error status."""


class EnrollmentOptions(TypedDict):
    """Optional per-domain asset attributes taken from a domain's cvdEnrollment document.

    `create_asset` copies every key whose value is not None into the asset attributes.
    """

    description: str | None
    reference: str | None


# Retry on transient errors for idempotent methods only.
# POST is excluded to avoid duplicate asset/scope creation.
_retry = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "PUT"],
)
_session = requests.Session()
_session.mount("https://", HTTPAdapter(max_retries=_retry))


def _request(settings: HackerOneSettings, method: str, url: str, **kwargs) -> Response:
    """Send an authenticated request; raise HackerOneAPIError when the connection fails."""
    try:
        return _session.request(
            method, url, auth=(settings.username, settings.token), headers=HEADERS, **kwargs
        )
    except requests.exceptions.RequestException as e:
        raise HackerOneAPIError(str(e)) from e


def handle_res(res: Response) -> dict:
    """Return the decoded JSON body of `res`.

    Raises HackerOneAPIError, carrying the response's `errors` list, on a non-2xx status.
    A body that is not valid JSON raises ValueError instead.
    """
    if not res.ok:
        errors = res.json().get("errors", [])
        raise HackerOneAPIError(errors)
    return res.json()


def get_all_assets(settings: HackerOneSettings, scope: str = "all", archived: bool = False) -> dict:
    """List organization domain assets.

    `scope` filters by coverage and must be one of "all", "new", "in_scope",
    "out_of_scope" or "untested"; any other value adds no coverage filter.
    `archived=True` adds the archived filter.
    """
    scope_enums = ["all", "new", "in_scope", "out_of_scope", "untested"]
    # Only domain assets are listed. No filter on asset state is applied.
    filters = "filter[asset_types][]=domain"
    if archived:
        filters += "&filter[archived]=true"
    if scope in scope_enums:
        filters += f"&filter[coverage]={scope}"

    return handle_res(_request(settings, "GET", f"{settings.assets_url}?{filters}"))


def get_asset(settings: HackerOneSettings, domain: str) -> dict:
    """Look up the domain asset whose identifier is `domain`."""
    return handle_res(
        _request(
            settings,
            "GET",
            f"{settings.assets_url}?filter[identifier]={domain}&filter[asset_types][]=domain",
        )
    )


def create_asset(
    settings: HackerOneSettings, domain: str, options: EnrollmentOptions, asset_tag_id: int
) -> dict:
    """Create a domain asset tagged with `asset_tag_id`; None-valued options are omitted."""
    data = {
        "data": {
            "type": "asset",
            "attributes": {
                "asset_type": "domain",
                "identifier": domain,
                "max_severity": "high",
                "description": options.get("description", None),
                "reference": options.get("reference", None),
            },
            "relationships": {"asset_tags": {"data": [{"id": asset_tag_id}]}},
        }
    }
    return handle_res(_request(settings, "POST", settings.assets_url, json=data))


def archive_assets(settings: HackerOneSettings, data: dict) -> dict:
    """Archive the assets listed in `data` (a {"data": [...]} payload)."""
    return handle_res(_request(settings, "POST", f"{settings.assets_url}/archive", json=data))


def get_scope(settings: HackerOneSettings, asset_id: str) -> dict:
    """List the scope entries of asset `asset_id`."""
    return handle_res(
        _request(
            settings,
            "GET",
            f"{settings.assets_url}/{asset_id}/scopes",
        )
    )


def add_scope(settings: HackerOneSettings, asset_id: str, enrollment_status: str) -> dict:
    """Add the configured program's scope to `asset_id`; eligible for submission only when enrolled."""
    data = {
        "data": {
            "type": "structured-scope",
            "attributes": {
                "eligible_for_bounty": False,
                "eligible_for_submission": enrollment_status == "enrolled",
            },
            "relationships": {
                "programs": {"data": [{"id": settings.program_id, "type": "program"}]}
            },
        }
    }
    return handle_res(
        _request(
            settings,
            "POST",
            f"{settings.assets_url}/{asset_id}/scopes",
            json=data,
        )
    )


def update_scope(
    settings: HackerOneSettings, asset_id: str, scope_id: str, enrollment_status: str
) -> dict:
    """Set scope `scope_id` of `asset_id` eligible for submission only when `enrollment_status` is "enrolled"."""
    data = {
        "data": {
            "type": "structured-scope",
            "attributes": {
                "eligible_for_bounty": False,
                "eligible_for_submission": enrollment_status == "enrolled",
            },
        }
    }
    return handle_res(
        _request(
            settings,
            "PUT",
            f"{settings.assets_url}/{asset_id}/scopes/{scope_id}",
            json=data,
        )
    )


def get_asset_tags(settings: HackerOneSettings, page_number: int = 1, page_size: int = 100) -> dict:
    """Fetch one page of the organization's asset tags."""
    return handle_res(
        _request(
            settings,
            "GET",
            f"{settings.asset_tags_url}?page[size]={page_size}&page[number]={page_number}",
        )
    )
