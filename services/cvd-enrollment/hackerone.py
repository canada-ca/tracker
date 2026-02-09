import requests
from requests import Response
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

ORG_ASSETS_URL = f"{BASE_URL}/organizations/{ORG_ID}/assets"

logger = logging.getLogger(__name__)


class EnrollmentOptions(TypedDict):
    description: str = None
    max_severity: str = None
    confidentiality_requirement: str = None
    integrity_requirement: str = None
    availability_requirement: str = None


def handle_res(res: Response):
    if res.status_code != 200:
        raise Exception(res.json().get("errors", []))
    return res.json()


def get_all_assets(archived: bool = False):
    # TODO add filters to make the most correct list possible
    filters = "filter[asset_types][]=domain"  # &filter[state][]=confirmed,unconfirmed"
    if archived:
        filters += "&filter[archived]=true"

    return handle_res(
        requests.get(
            f"{ORG_ASSETS_URL}?{filters}",
            auth=(API_USERNAME, API_TOKEN),
            headers=HEADERS,
        )
    )


def get_asset(domain: str):
    return handle_res(
        requests.get(
            f"{ORG_ASSETS_URL}?filter[identifier]={domain}&filter[asset_types][]=domain",
            auth=(API_USERNAME, API_TOKEN),
            headers=HEADERS,
        )
    )


def create_asset(domain: str, options: EnrollmentOptions):
    data = {
        "data": {
            "type": "asset",
            "attributes": {"asset_type": "domain", "identifier": domain, **options},
            "relationships": {"asset_tags": {"data": []}},
        }
    }
    return handle_res(
        requests.post(
            f"{ORG_ASSETS_URL}",
            auth=(API_USERNAME, API_TOKEN),
            headers=HEADERS,
            json=data,
        )
    )


def archive_assets(data: dict):
    return handle_res(
        requests.post(
            f"{ORG_ASSETS_URL}/archive",
            auth=(API_USERNAME, API_TOKEN),
            headers=HEADERS,
            json=data,
        )
    )
