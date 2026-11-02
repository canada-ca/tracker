"""CVD enrollment service entrypoint: sync enrolled/denied domains into HackerOne."""

import logging
import sys

from arango import ArangoClient
from arango.database import StandardDatabase
from dotenv import load_dotenv

from config import Config, ConfigError
from db import fetch_domain_owners, fetch_domains
from hackerone import HackerOneAPIError, get_all_assets
from logging_setup import configure_logging
from notify import send_enrollment_notification
from sync import (
    archive,
    asset_id_by_identifier,
    compute_changes,
    create_assets,
    rescope_assets,
)
from tags import get_gc_orgid_tags

logger = logging.getLogger(__name__)


def fetch_h1_assets() -> tuple[list[dict], list[dict]]:
    """Return (in_scope, out_of_scope) assets.

    Raises HackerOneAPIError if in-scope assets are unavailable. A failed
    out-of-scope fetch degrades to an empty list, skipping deny -> enrolled detection.
    """
    in_scope = get_all_assets(scope="in_scope").get("data", [])
    try:
        out_of_scope = get_all_assets(scope="out_of_scope").get("data", [])
    except HackerOneAPIError as e:
        logger.warning(f"Could not fetch out-of-scope assets, rescope detection will be skipped: {e}")
        out_of_scope = []
    return in_scope, out_of_scope


def _create_new_assets(db: StandardDatabase, domains: list[dict], label: str) -> None:
    if not domains:
        return
    logger.info(f"Creating {len(domains)} new {label} assets.")
    try:
        tags = get_gc_orgid_tags()
    except HackerOneAPIError as e:
        logger.error(f"Could not fetch asset tags, {label} creations will fail: {e}")
        tags = []
    owners = fetch_domain_owners(db, [d["_id"] for d in domains])
    _, failures = create_assets(domains, tags, owners)
    if failures:
        logger.warning(f"{failures}/{len(domains)} {label} asset creations failed.")


def _rescope(names: tuple[str, ...], status: str, asset_id_map: dict[str, str]) -> None:
    if not names:
        return
    logger.info(f"Rescoping {len(names)} assets to {status}.")
    _, failures = rescope_assets(names, status, asset_id_map)
    if failures:
        logger.warning(f"{failures}/{len(names)} rescopes to {status} failed.")


def main(db: StandardDatabase, config: Config) -> None:
    """Run one sync pass: fetch, compute changes, apply them, notify."""
    try:
        all_domains, enrolled, denied = fetch_domains(db)
    except Exception as e:
        logger.error(f"Error(s) while fetching domains from DB: {e}")
        return
    logger.info(f"Found {len(enrolled)} enrolled domains.")

    try:
        in_scope, out_of_scope = fetch_h1_assets()
    except HackerOneAPIError as e:
        logger.error(f"Error(s) while fetching H1 assets: {e}")
        return

    changes = compute_changes(all_domains, enrolled, denied, in_scope, out_of_scope)
    asset_id_map = asset_id_by_identifier(in_scope + out_of_scope)

    _create_new_assets(db, list(changes.new_enrolled), "enrolled")
    _rescope(changes.rescope_to_enrolled, "enrolled", asset_id_map)
    _create_new_assets(db, list(changes.new_denied), "out-of-scope")
    _rescope(changes.rescope_to_denied, "deny", asset_id_map)

    if changes.to_archive:
        logger.info(f"Archiving {len(changes.to_archive)} assets from CVD program.")
        archive(changes.to_archive)

    announced = changes.newly_enrolled_names
    if announced:
        send_enrollment_notification(
            email=config.service_account_email, enrolled_domains=announced
        )


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
    main(db=database, config=config)
    logger.info("CVD Enrollment service shutting down...")
