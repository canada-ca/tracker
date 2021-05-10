import pytest
from arango import ArangoClient
from pretend import stub
from autoscan import *

arango_client = ArangoClient(hosts="http://testdb:8529")


def test_dispatch():

    # Connect to arango system DB and create test DB
    sys_db = arango_client.db("_system", username="", password="")
    sys_db.create_database("test")

    # Establish DB connection
    db = arango_client.db("test", username="", password="")
    db.create_collection("domains")

    input_domains = [
        {"domain": "cyber.gc.ca", "selectors": ["selector1", "selector2"]},
        {"domain": "canada.ca"},
        {"domain": "forces.gc.ca"},
    ]

    for domain in input_domains:
        db.collection("domains").insert(domain)

    client_stub = stub(post=lambda url, json: None)

    dispatched = scan("testdb", 8529, "test", "", "", http_client=client_stub)

    assert dispatched == len(input_domains)
