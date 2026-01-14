import logging
import os
import sys

from arango import ArangoClient
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

from update_selectors import update_selectors

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="[%(asctime)s :: %(name)s :: %(levelname)s] %(message)s",
)
logger = logging.getLogger()

load_dotenv()

LOGGER_LEVEL = os.getenv("LOGGER_LEVEL", "INFO")

logger_level = logging.getLevelName(LOGGER_LEVEL)
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

ARANGO_DB_USER = os.getenv("ARANGO_DB_USER")
ARANGO_DB_PASS = os.getenv("ARANGO_DB_PASS")
ARANGO_DB_NAME = os.getenv("ARANGO_DB_NAME")
ARANGO_DB_URL = os.getenv("ARANGO_DB_URL")

COSMOS_DB_CONN_STRING = os.getenv("COSMOS_DB_CONN_STRING")
COSMOS_DB_NAME = os.getenv("COSMOS_DB_NAME")
COSMOS_DB_SELECTORS_CONTAINER = os.getenv("COSMOS_DB_SELECTORS_CONTAINER")

REMOVE_SELECTORS = os.getenv("REMOVE_SELECTORS", "false").lower() == "true"


if __name__ == "__main__":
    missing_envs = []
    for key, val in {
        "ARANGO_DB_USER": ARANGO_DB_USER,
        "ARANGO_DB_PASS": ARANGO_DB_PASS,
        "ARANGO_DB_NAME": ARANGO_DB_NAME,
        "ARANGO_DB_URL": ARANGO_DB_URL,
        "COSMOS_DB_CONN_STRING": COSMOS_DB_CONN_STRING,
        "COSMOS_DB_NAME": COSMOS_DB_NAME,
        "COSMOS_DB_SELECTORS_CONTAINER": COSMOS_DB_SELECTORS_CONTAINER,
    }.items():
        if val is None:
            missing_envs.append(key)

    if len(missing_envs) > 0:
        logger.error(f"Missing environment variables: {missing_envs}")
        exit(1)

    # Establish DB connection
    arango_client = ArangoClient(hosts=ARANGO_DB_URL)
    db = arango_client.db(
        ARANGO_DB_NAME, username=ARANGO_DB_USER, password=ARANGO_DB_PASS
    )

    # Set CosmosDB http_logging_policy logging level to warning to avoid excessive logging
    logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(
        logging.WARNING
    )

    # Initialize the Cosmos client using connection string
    cosmos_client = CosmosClient.from_connection_string(COSMOS_DB_CONN_STRING)

    # Get DB
    cosmos_db = cosmos_client.get_database_client(COSMOS_DB_NAME)

    # Get container
    selector_container = cosmos_db.get_container_client(COSMOS_DB_SELECTORS_CONTAINER)

    update_selectors(
        arango_db=db,
        selector_container=selector_container,
        remove_selectors=REMOVE_SELECTORS,
    )
