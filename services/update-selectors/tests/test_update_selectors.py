import datetime
import os

import update_selectors
import pytest
from arango import ArangoClient
from azure.cosmos import CosmosClient, PartitionKey
from dotenv import load_dotenv
import urllib3
from urllib3.exceptions import InsecureRequestWarning


load_dotenv(os.path.join(os.path.dirname(__file__), "test.env"))

ARANGO_DB_URL = os.getenv("ARANGO_DB_URL", "http://localhost:8530")
ARANGO_DB_USER = os.getenv("ARANGO_DB_USER", "root")
ARANGO_DB_PASS = os.getenv("ARANGO_DB_PASS", "test")

COSMOS_DB_HOST = os.getenv("COSMOS_DB_HOST", "localhost")

# Well known connection string for emulator
azure_cosmos_db_conn_string = f"AccountEndpoint=https://{COSMOS_DB_HOST}:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==;"


def get_date_ago_formatted(days):
    return (datetime.datetime.now() - datetime.timedelta(days=days)).strftime(
        "%Y-%m-%d"
    )


class TestUpdateSelectors:
    @pytest.fixture
    def selector_container(self):
        # Disable insecure request warnings
        urllib3.disable_warnings(InsecureRequestWarning)
        cosmos_client = CosmosClient.from_connection_string(
            azure_cosmos_db_conn_string, connection_verify=False, connection_timeout=15
        )
        if "testdb" in cosmos_client.list_databases():
            cosmos_client.delete_database("testdb")
        cosmos_db = cosmos_client.create_database(id="testdb")
        selector_container = cosmos_db.create_container(
            id="selectors",
            partition_key=PartitionKey(path="/id"),
        )

        selectors_to_insert = [
            {
                "id": "domain2",
                "data": [
                    {
                        # This selector already exists with this domain
                        "selector": "selector2",
                        "first_seen": get_date_ago_formatted(10),
                        "last_seen": get_date_ago_formatted(10),
                    },
                    {
                        # This selector should be skipped (older than 1 year)
                        "selector": "selector1",
                        "first_seen": get_date_ago_formatted(400),
                        "last_seen": get_date_ago_formatted(370),
                    },
                ],
            },
            {
                # New selector for this domain
                "id": "domain3",
                "data": [
                    {
                        "selector": "selector4",
                        "first_seen": get_date_ago_formatted(10),
                        "last_seen": get_date_ago_formatted(10),
                    }
                ],
            },
        ]
        for sel in selectors_to_insert:
            selector_container.upsert_item(sel)
        yield selector_container
        cosmos_db.delete_container("selectors")
        cosmos_client.delete_database("testdb")

    @pytest.fixture
    def arango_db(self):
        arango_client = ArangoClient(hosts=os.getenv("ARANGO_DB_URL"))
        sys_db = arango_client.db(
            "_system",
            username=os.getenv("ARANGO_DB_USER"),
            password=os.getenv("ARANGO_DB_PASS"),
        )
        db_name = os.path.basename(__file__).split(".")[0]
        if sys_db.has_database(db_name):
            sys_db.delete_database(db_name)
        sys_db.create_database(db_name)
        db = arango_client.db(
            db_name,
            username=os.getenv("ARANGO_DB_USER"),
            password=os.getenv("ARANGO_DB_PASS"),
        )
        existing_selectors = [
            {"_id": "selectors/1", "key": "1", "selector": "selector1"},
            {"_id": "selectors/2", "key": "2", "selector": "selector2"},
            {"_id": "selectors/3", "key": "3", "selector": "selector3"},
        ]
        existing_domains = [
            {"_id": "domains/1", "domain": "domain1"},
            {"_id": "domains/2", "domain": "domain2"},
            {"_id": "domains/3", "domain": "domain3"},
        ]
        existing_domains_to_selectors = [
            {
                # This selector should be removed (no last_seen or first_seen)
                "_id": "domainsToSelectors/1",
                "_from": "domains/1",
                "_to": "selectors/1",
            },
            {
                # This selector should not be removed
                "_id": "domainsToSelectors/2",
                "_from": "domains/2",
                "_to": "selectors/2",
                "first_seen": get_date_ago_formatted(400),
                "last_seen": get_date_ago_formatted(10),
            },
            {
                # This selector should be removed (last_seen older than 1 year)
                "_id": "domainsToSelectors/3",
                "_from": "domains/2",
                "_to": "selectors/3",
                "first_seen": get_date_ago_formatted(400),
                "last_seen": get_date_ago_formatted(370),
            },
        ]
        for collection, docs in {
            "selectors": existing_selectors,
            "domains": existing_domains,
        }.items():
            db.create_collection(collection)
            db[collection].insert_many(docs)
        db.create_collection("domainsToSelectors", edge=True)
        db["domainsToSelectors"].insert_many(existing_domains_to_selectors)
        yield db
        sys_db.delete_database(db_name)

    @pytest.fixture(autouse=True)
    def check_starting_case(self, arango_db):
        # Check starting case
        assert arango_db["selectors"].count() == 3
        assert arango_db["domains"].count() == 3
        assert arango_db["domainsToSelectors"].count() == 3
        assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/1' domainsToSelectors
                    RETURN v
                """,
                count=True,
            ).count()
            == 1
        )
        assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/2' domainsToSelectors
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
        assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/3' domainsToSelectors
                    RETURN v
                """,
                count=True,
            ).count()
            == 0
        )

    def test_update_selectors_with_removal(self, arango_db, selector_container):
        update_selectors.update_selectors(
            arango_db,
            selector_container,
            remove_selectors=True,
        )

        # Check ending case
        # selector4 should have been added
        assert arango_db["selectors"].count() == 4
        assert arango_db["domains"].count() == 3
        t = [t for t in arango_db["domainsToSelectors"].all()]
        # selector3 edge to domain2 should have been removed, selector4 edge to domain3 should have been added
        assert arango_db["domainsToSelectors"].count() == 2

        # domain1 should have no selectors (selector1 edge should have been removed)
        domain1_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/1' domainsToSelectors
                    RETURN v.selector
                """,
            )
        ]
        assert len(domain1_selectors) == 0

        # domain2 should have selector2 only (selector3 edge should have been removed)
        domain2_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/2' domainsToSelectors
                    RETURN v
                """,
            )
        ]
        assert "selector2" in domain2_selectors
        assert "selector3" not in domain2_selectors

        # domain3 to selector4 edge should have been added
        domain3_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/3' domainsToSelectors
                    RETURN v
                """,
            )
        ]
        assert "selector4" in domain3_selectors

    def test_update_selectors_without_removal(self, arango_db, selector_container):
        update_selectors.update_selectors(
            arango_db,
            selector_container,
            remove_selectors=False,
        )

        # Check ending case
        # selector4 should have been added
        assert arango_db["selectors"].count() == 4
        assert arango_db["domains"].count() == 3
        # selector3 edge to domain2 should not have been removed, selector4 edge to domain3 should have been added
        assert arango_db["domainsToSelectors"].count() == 4

        # domain1 should have no selectors (selector1 edge should not have been removed)
        domain1_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/1' domainsToSelectors
                    RETURN v
                """,
            )
        ]
        assert len(domain1_selectors) == 1

        domain2_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/2' domainsToSelectors
                    RETURN v
                """,
            )
        ]
        assert "selector2" in domain2_selectors
        assert "selector3" in domain2_selectors
        # selector4 edge to domain3 should have been added
        domain3_selectors = [
            sel["selector"]
            for sel in arango_db.aql.execute(
                """
                FOR v, e IN 1..1 ANY 'domains/3' domainsToSelectors
                    RETURN v
                """,
            )
        ]
        assert "selector4" in domain3_selectors
