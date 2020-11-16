import pytest
from arango import ArangoClient
from pretend import stub
from autoscan import *

arango_client = ArangoClient(hosts="testdb")


def test_dispatch():

    # Connect to arango system DB and create test DB
    sys_db = client.db("_system", username="", password="")
    sys_db.create_database("test")

    # Establish DB connection
    db = db_client.db("test", username="", password="")
    db.create_collection("domains")

    input_domains = [
        {"domain": "cyber.gc.ca"},
        {"domain": "canada.ca"},
        {"domain": "forces.gc.ca"},
    ]

    for domain in input_domains:
        db.collection("domains").insert(domain)

    client_stub = stub(post=lambda url, json: None)

    dispatched = scan(
        "testdb", "test", "", "", http_client=client_stub
    )

    assert dispatched == len(input_domains)
