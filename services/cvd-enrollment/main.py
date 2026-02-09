import logging
import sys
import os

from arango import ArangoClient
from arango.database import StandardDatabase
from dotenv import load_dotenv
from hackerone import get_all_assets, create_asset, archive_assets

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
    return [a.get("attribute", {}).get("identifier", None) for a in assets]


def get_domain_names(domains: list[dict]):
    return [d.get("domain", None) for d in domains]


def main(db: StandardDatabase):
    try:
        cursor = db.aql.execute(
            """
            FOR d IN domains
                FILTER d.archived != true
                FILTER d.rcode != "NXDOMAIN"
                FILTER d.blocked != true
                FILTER d.cvdEnrollment.status == "enrolled"
                RETURN d
            """
        )
        enrolled_domains = list(cursor.batch())
    except Exception as e:
        logger.error(f"Error(s) while fetching CVD enrolled domains: {e}")
        return

    try:
        cvd_assets = get_all_assets().get("data", [])
    except Exception as e:
        logger.error(f"Error(s) while fetching CVD enrolled domains: {e}")
        return

    # find enrolled domains not in CVD program
    new_assets = [
        d
        for d in enrolled_domains
        if d.get("domain", None) not in get_asset_identifiers(cvd_assets)
    ]

    logger.info(f"Creating {len(new_assets)} assets from CVD program.")
    for a in new_assets:
        try:
            res = create_asset(
                domain=a.get("domain"), options=a.get("cvdEnrollment", {})
            )
            logger.info(res)
        except Exception as e:
            logger.error(f"Error(s) while attempting to create new asset: {e}")
            continue

    # TODO handle re-adding archived assets: The hackerone API currently does not support this function. Revisit once possible

    # find h1 assets to archive
    # TODO handle existing h1 assets that are not in Tracker
    archive_list = [
        a
        for a in cvd_assets
        if a.get("attributes", {}).get("identifier", None)
        not in get_domain_names(enrolled_domains)
    ]

    # archive assets no longer enrolled
    logger.info(f"Archiving {len(archive_list)} assets from CVD program.")
    try:
        res = archive_assets(data={"data": archive_list})
        logger.info(res)
    except Exception as e:
        logger.error(f"Error(s) while archiving CVD enrolled domains: {e}")
        return


if __name__ == "__main__":
    logger.info("CVD Enrollment service started")

    client = ArangoClient(hosts=DB_URL)
    db = client.db(DB_NAME, username=DB_USER, password=DB_PASS)

    main(db=db)

    logger.info("CVD Enrollment service shutting down...")
