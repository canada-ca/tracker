import requests
from requests import Response
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os
import logging
from dotenv import load_dotenv
from typing import TypedDict


load_dotenv()

BASE_URL = "https://api.hackerone.com/v1"
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

API_USERNAME = os.getenv("API_USERNAME")
API_TOKEN = os.getenv("API_TOKEN")
ORG_ID = os.getenv("ORG_ID")
PROGRAM_ID = os.getenv("PROGRAM_ID")

ORG_ASSETS_URL = f"{BASE_URL}/organizations/{ORG_ID}/assets"

logger = logging.getLogger(__name__)


class HackerOneAPIError(Exception):
    pass


class EnrollmentOptions(TypedDict):
    description: str | None
    max_severity: str | None
    confidentiality_requirement: str | None
    integrity_requirement: str | None
    availability_requirement: str | None


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


def _request(method: str, url: str, **kwargs) -> Response:
    try:
        return _session.request(
            method, url, auth=(API_USERNAME, API_TOKEN), headers=HEADERS, **kwargs
        )
    except requests.exceptions.RequestException as e:
        raise HackerOneAPIError(str(e)) from e


def handle_res(res: Response) -> dict:
    if not res.ok:
        errors = res.json().get("errors", [])
        raise HackerOneAPIError(errors)
    return res.json()


def get_all_assets(scope: str = "all", archived: bool = False) -> dict:
    scope_enums = ["all", "new", "in_scope", "out_of_scope", "untested"]
    # TODO add filters to make the most correct list possible
    filters = "filter[asset_types][]=domain"  # &filter[state][]=confirmed,unconfirmed"
    if archived:
        filters += "&filter[archived]=true"
    if scope in scope_enums:
        filters += f"&filter[coverage]={scope}"

    return handle_res(_request("GET", f"{ORG_ASSETS_URL}?{filters}"))


def get_asset(domain: str) -> dict:
    return handle_res(
        _request(
            "GET",
            f"{ORG_ASSETS_URL}?filter[identifier]={domain}&filter[asset_types][]=domain",
        )
    )


def create_asset(domain: str, options: EnrollmentOptions) -> dict:
    data = {
        "data": {
            "type": "asset",
            "attributes": {"asset_type": "domain", "identifier": domain, **options},
            "relationships": {"asset_tags": {"data": []}},
        }
    }
    return handle_res(_request("POST", ORG_ASSETS_URL, json=data))


def archive_assets(data: dict) -> dict:
    return handle_res(_request("POST", f"{ORG_ASSETS_URL}/archive", json=data))


def get_scope(asset_name: str) -> dict:
    return handle_res(
        _request(
            "GET",
            f"{BASE_URL}/programs/{PROGRAM_ID}/structured_scopes?filter[asset_identifier]={asset_name}",
        )
    )


def add_scope(asset_name: str, enrollment_status: str) -> dict:
    data = {
        "data": {
            "type": "structured-scope",
            "attributes": {
                "asset_identifier": asset_name,
                "asset_type": "URL",
                "eligible_for_bounty": False,
                "eligible_for_submission": enrollment_status == "enrolled",
            },
        }
    }
    return handle_res(
        _request(
            "POST",
            f"{BASE_URL}/programs/{PROGRAM_ID}/structured_scopes",
            json=data,
        )
    )


def update_scope(asset_name: str, scope_id: str, enrollment_status: str) -> dict:
    data = {
        "data": {
            "type": "structured-scope",
            "attributes": {
                "asset_identifier": asset_name,
                "asset_type": "URL",
                "eligible_for_submission": enrollment_status == "enrolled",
            },
        }
    }
    return handle_res(
        _request(
            "PUT",
            f"{BASE_URL}/programs/{PROGRAM_ID}/structured_scopes/{scope_id}",
            json=data,
        )
    )
