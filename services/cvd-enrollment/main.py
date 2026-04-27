import logging
import sys
import os

from arango import ArangoClient
from arango.database import StandardDatabase
from dotenv import load_dotenv
from hackerone import (
    HackerOneAPIError,
    add_scope,
    get_all_assets,
    create_asset,
    archive_assets,
    get_scope,
    update_scope,
)

load_dotenv()

LOGGER_LEVEL = os.getenv("LOGGER_LEVEL", "INFO")

logger_level = logging._nameToLevel.get(LOGGER_LEVEL, None)
if not isinstance(logger_level, int):
    print(f"Invalid logger level: {LOGGER_LEVEL}")
    sys.exit(1)

# Split logging to stdout and stderr
# DEBUG and INFO to stdout
# WARNING and above to stderr
h1 = logging.StreamHandler(sys.stdout)
h1.setLevel(logging.DEBUG)
h1.addFilter(lambda record: record.levelno <= logging.INFO)
h2 = logging.StreamHandler(sys.stderr)
h2.setLevel(logging.WARNING)

logging.basicConfig(
    level=logger_level,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
    handlers=[h1, h2],
)
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_URL = os.getenv("DB_URL")


def get_asset_identifiers(assets: list[dict]):
    return [a.get("attributes", {}).get("identifier", None) for a in assets]


def get_domain_names(domains: list[dict]):
    return [d.get("domain", None) for d in domains]


def fetch_domains(db: StandardDatabase) -> tuple[list[dict], list[dict], list[dict]]:
    cursor = db.aql.execute(
        """
        FOR d IN domains
            FILTER d.archived != true
            FILTER d.rcode != "NXDOMAIN"
            RETURN d
        """
    )
    all_domains = list(cursor)

    enrolled = [
        d
        for d in all_domains
        if isinstance(d.get("cvdEnrollment"), dict)
        and d.get("cvdEnrollment", {}).get("status") == "enrolled"
    ]
    denied = [
        d
        for d in all_domains
        if isinstance(d.get("cvdEnrollment"), dict)
        and d.get("cvdEnrollment", {}).get("status") == "deny"
    ]
    return all_domains, enrolled, denied


def fetch_h1_assets() -> tuple[list[dict], list[dict]]:
    # Raises HackerOneAPIError on failure — caller should abort if in_scope is unavailable.
    in_scope = get_all_assets(scope="in_scope").get("data", [])

    # A degraded run without out-of-scope data is preferable to aborting entirely.
    # Rescope detection (deny → enrolled) will be skipped for this run.
    try:
        out_of_scope = get_all_assets(scope="out_of_scope").get("data", [])
    except HackerOneAPIError as e:
        logger.warning(
            f"Could not fetch out-of-scope assets, rescope detection will be skipped: {e}"
        )
        out_of_scope = []

    return in_scope, out_of_scope


def create_assets(domains: list[dict]) -> tuple[int, int]:
    successes, failures = 0, 0
    for a in domains:
        domain = a.get("domain")
        enrollment_options = a.get("cvdEnrollment", {})
        try:
            res = create_asset(domain=domain, options=enrollment_options)
            logger.info(res)
            asset_id = res.get("data", {}).get("id")
            res = add_scope(
                asset_id=asset_id,
                enrollment_status=enrollment_options.get("status"),
            )
            logger.info(res)
            successes += 1
        except HackerOneAPIError as e:
            logger.error(f"Failed to create asset {domain}: {e}")
            failures += 1
    return successes, failures


def rescope_assets(
    domain_names: list[str], enrollment_status: str, asset_id_map: dict[str, str]
) -> tuple[int, int]:
    successes, failures = 0, 0
    for domain in domain_names:
        asset_id = asset_id_map.get(domain)
        if not asset_id:
            logger.error(f"No asset ID found for {domain}, skipping rescope.")
            failures += 1
            continue
        try:
            scope_data = get_scope(asset_id).get("data", [])
            if not scope_data:
                logger.error(
                    f"No existing scope entry found for {domain}, skipping rescope."
                )
                failures += 1
                continue
            scope_id = scope_data[0].get("id", "")
            res = update_scope(
                asset_id=asset_id,
                scope_id=scope_id,
                enrollment_status=enrollment_status,
            )
            logger.info(res)
            successes += 1
        except HackerOneAPIError as e:
            logger.error(f"Failed to update scope for {domain}: {e}")
            failures += 1
    return successes, failures


def archive_unenrolled_assets(assets: list[dict]):
    res = archive_assets(data={"data": assets})
    logger.info(res)


def main(db: StandardDatabase):
    try:
        all_domains, enrolled_domains, denied_domains = fetch_domains(db)
    except Exception as e:
        logger.error(f"Error(s) while fetching domains from DB: {e}")
        return

    logger.info(f"Found {len(enrolled_domains)} enrolled domains.")

    try:
        cvd_assets, cvd_assets_out_of_scope = fetch_h1_assets()
    except HackerOneAPIError as e:
        logger.error(f"Error(s) while fetching H1 assets: {e}")
        return

    # pre-compute sets for O(1) lookups
    cvd_identifiers = set(get_asset_identifiers(cvd_assets))
    out_of_scope_identifiers = set(get_asset_identifiers(cvd_assets_out_of_scope))
    asset_id_map = {
        a.get("attributes", {}).get("identifier"): a.get("id")
        for a in cvd_assets + cvd_assets_out_of_scope
        if a.get("attributes", {}).get("identifier")
    }
    all_domain_names = set(get_domain_names(all_domains))
    enrolled_domain_names = set(get_domain_names(enrolled_domains))
    denied_domain_names = set(get_domain_names(denied_domains))

    # enrolled domains not yet in H1
    new_assets = [
        d
        for d in enrolled_domains
        if d.get("domain") not in cvd_identifiers
        and d.get("domain") not in out_of_scope_identifiers
    ]
    if new_assets:
        logger.info(f"Creating {len(new_assets)} new enrolled assets.")
        _, fail = create_assets(new_assets)
        if fail:
            logger.warning(f"{fail}/{len(new_assets)} enrolled asset creations failed.")

    # TODO handle re-adding archived assets: The hackerone API currently does not support this function. Revisit once possible

    # deny → enrolled: already exist in H1 as out-of-scope
    rescoped_to_enrolled = [
        d.get("domain")
        for d in enrolled_domains
        if d.get("domain") in out_of_scope_identifiers
    ]
    if rescoped_to_enrolled:
        logger.info(f"Rescoping {len(rescoped_to_enrolled)} assets to enrolled.")
        _, fail = rescope_assets(rescoped_to_enrolled, "enrolled", asset_id_map)
        if fail:
            logger.warning(
                f"{fail}/{len(rescoped_to_enrolled)} rescopes to enrolled failed."
            )

    # denied domains not yet in H1
    new_unscoped_assets = [
        d
        for d in denied_domains
        if d.get("domain") not in cvd_identifiers
        and d.get("domain") not in out_of_scope_identifiers
    ]
    if new_unscoped_assets:
        logger.info(f"Creating {len(new_unscoped_assets)} new out-of-scope assets.")
        _, fail = create_assets(new_unscoped_assets)
        if fail:
            logger.warning(
                f"{fail}/{len(new_unscoped_assets)} out-of-scope asset creations failed."
            )

    # enrolled → deny: currently in-scope in H1
    rescoped_to_denied = [
        identifier
        for a in cvd_assets
        if (identifier := a.get("attributes", {}).get("identifier"))
        and identifier in denied_domain_names
    ]
    if rescoped_to_denied:
        logger.info(f"Rescoping {len(rescoped_to_denied)} assets to out-of-scope.")
        _, fail = rescope_assets(rescoped_to_denied, "deny", asset_id_map)
        if fail:
            logger.warning(
                f"{fail}/{len(rescoped_to_denied)} rescopes to out-of-scope failed."
            )

    # archive in-scope H1 assets that are no longer enrolled or denied
    archive_list = [
        a
        for a in cvd_assets
        if (identifier := a.get("attributes", {}).get("identifier"))
        and identifier not in enrolled_domain_names
        and identifier not in denied_domain_names
        and identifier in all_domain_names
    ]
    if archive_list:
        logger.info(f"Archiving {len(archive_list)} assets from CVD program.")
        try:
            archive_unenrolled_assets(archive_list)
        except HackerOneAPIError as e:
            logger.error(f"Error(s) while archiving CVD assets: {e}")


if __name__ == "__main__":
    logger.info("CVD Enrollment service started")

    client = ArangoClient(hosts=DB_URL)
    db = client.db(DB_NAME, username=DB_USER, password=DB_PASS)

    main(db=db)

    logger.info("CVD Enrollment service shutting down...")
