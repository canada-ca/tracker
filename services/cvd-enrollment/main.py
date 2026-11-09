"""CVD enrollment service entrypoint: sync enrolled/denied domains into HackerOne."""

import logging
import sys

from arango import ArangoClient
from arango.database import StandardDatabase
from config import Config, ConfigError
from db import fetch_domain_owners, fetch_domains
from dotenv import load_dotenv
from hackerone import HackerOneAPIError, HackerOneSettings, get_all_assets
from logging_setup import configure_logging
from sync import (
    archive,
    asset_id_by_identifier,
    compute_changes,
    create_assets,
    rescope_assets,
)
from tags import get_gc_orgid_tags

logger = logging.getLogger(__name__)


def fetch_h1_assets(settings: HackerOneSettings) -> tuple[list[dict], list[dict]]:
    """Return (in_scope, out_of_scope) assets.

    Raises HackerOneAPIError if in-scope assets are unavailable. A failed
    out-of-scope fetch degrades to an empty list. Deny to enrolled rescoping is then
    skipped, and domains whose assets are out of scope count as not yet in HackerOne.
    """
    in_scope = get_all_assets(settings, scope="in_scope").get("data", [])
    try:
        out_of_scope = get_all_assets(settings, scope="out_of_scope").get("data", [])
    except HackerOneAPIError as e:
        logger.warning(
            f"Could not fetch out-of-scope assets, rescope detection will be skipped: {e}"
        )
        out_of_scope = []
    return in_scope, out_of_scope


def _create_new_assets(
    db: StandardDatabase, settings: HackerOneSettings, domains: list[dict], label: str
) -> None:
    if not domains:
        return
    logger.info(f"Creating {len(domains)} new {label} assets.")
    try:
        tags = get_gc_orgid_tags(settings)
    except HackerOneAPIError as e:
        logger.error(f"Could not fetch asset tags, {label} creations will fail: {e}")
        tags = []

    try:
        owners = fetch_domain_owners(db, [d["_id"] for d in domains])
    except Exception as e:
        logger.error(f"Could not fetch domains owners, {label} creations will fail: {e}")
        owners = {}

    _, failures = create_assets(settings, domains, tags, owners)
    if failures:
        logger.warning(f"{failures}/{len(domains)} {label} asset creations failed.")


def _rescope(
    settings: HackerOneSettings, names: tuple[str, ...], status: str, asset_id_map: dict[str, str]
) -> None:
    if not names:
        return
    logger.info(f"Rescoping {len(names)} assets to {status}.")
    _, failures = rescope_assets(settings, names, status, asset_id_map)
    if failures:
        logger.warning(f"{failures}/{len(names)} rescopes to {status} failed.")


def main(db: StandardDatabase, config: Config) -> int:
    """Run one sync pass: fetch, compute changes, apply them."""
    try:
        all_domains, enrolled, denied = fetch_domains(db)
    except Exception as e:
        logger.error(f"Error(s) while fetching domains from DB: {e}")
        return 1
    logger.info(f"Found {len(enrolled)} enrolled domains.")

    try:
        in_scope, out_of_scope = fetch_h1_assets(config.hackerone)
    except HackerOneAPIError as e:
        logger.error(f"Error(s) while fetching H1 assets: {e}")
        return 1

    changes = compute_changes(all_domains, enrolled, denied, in_scope, out_of_scope)
    asset_id_map = asset_id_by_identifier(in_scope + out_of_scope)

    _create_new_assets(db, config.hackerone, list(changes.new_enrolled), "enrolled")
    _rescope(config.hackerone, changes.rescope_to_enrolled, "enrolled", asset_id_map)
    _create_new_assets(db, config.hackerone, list(changes.new_denied), "out-of-scope")
    _rescope(config.hackerone, changes.rescope_to_denied, "deny", asset_id_map)

    if changes.to_archive:
        logger.info(f"Archiving {len(changes.to_archive)} assets from CVD program.")
        archive(config.hackerone, changes.to_archive)

    return 0


if __name__ == "__main__":
    load_dotenv()
    try:
        config = Config.from_env()
    except ConfigError as e:
        print(e, file=sys.stderr)
        sys.exit(1)
    configure_logging(config.log_level)

    logger.info("CVD Enrollment service started")
    client = ArangoClient(hosts=config.db_url)
    database = client.db(config.db_name, username=config.db_user, password=config.db_pass)
    return_code = main(db=database, config=config)
    if return_code != 0:
        sys.exit(return_code)
    logger.info("CVD Enrollment service shutting down...")
