import pytest
import datetime
from starlette.testclient import TestClient
from arango import ArangoClient
from result_processor import *
from test_data import *

arango_client = ArangoClient(hosts="http://testdb:8529")
# Connect to arango system DB and create test DB
sys_db = arango_client.db("_system", username="", password="")
sys_db.create_database("test")

# Establish DB connection
test_db = arango_client.db("test", username="", password="")
graph = test_db.create_graph("compliance")
graph.create_vertex_collection("domains")
graph.create_vertex_collection("dmarc")
graph.create_vertex_collection("spf")
graph.create_vertex_collection("dkim")
graph.create_vertex_collection("dkimResults")
graph.create_vertex_collection("https")
graph.create_vertex_collection("ssl")

graph.create_edge_definition(
    edge_collection="dkimToDkimResults",
    from_vertex_collections=["dkim"],
    to_vertex_collections=["dkimResults"],
)

graph.create_edge_definition(
    edge_collection="domainsDMARC",
    from_vertex_collections=["domains"],
    to_vertex_collections=["dmarc"],
)

graph.create_edge_definition(
    edge_collection="domainsSPF",
    from_vertex_collections=["domains"],
    to_vertex_collections=["spf"],
)

graph.create_edge_definition(
    edge_collection="domainsDKIM",
    from_vertex_collections=["domains"],
    to_vertex_collections=["dkim"],
)

graph.create_edge_definition(
    edge_collection="domainsSSL",
    from_vertex_collections=["domains"],
    to_vertex_collections=["ssl"],
)

graph.create_edge_definition(
    edge_collection="domainsHTTPS",
    from_vertex_collections=["domains"],
    to_vertex_collections=["https"],
)

test_db.collection("domains").insert(
    {
        "domain": "cyber.gc.ca",
        "selectors": ["selector1"],
        "status": {
            "dkim": "pass",
            "dmarc": "pass",
            "https": "pass",
            "spf": "pass",
            "ssl": "pass",
        },
    }
)


def test_process_https():
    tags = process_https(https_result_data)
    assert tags == expected_https_tags


def test_process_ssl():
    tags = process_ssl(ssl_result_data)
    assert tags == expected_ssl_tags


def test_process_dns():
    tags = process_dns(dns_result_data)
    assert tags["dmarc"] == expected_dmarc_tags
    assert tags["spf"] == expected_spf_tags
    assert tags["dkim"]["selector1"] == expected_dkim_tags


def test_insert_https():
    db = arango_client.db("test", username="", password="")
    domain_query = db.collection("domains").find({"domain": "cyber.gc.ca"}, limit=1)
    domain = domain_query.next()
    test_app = Server(
        db_host="http://testdb:8529", db_name="test", db_user="", db_pass=""
    )
    test_client = TestClient(test_app)

    test_payload = {
        "results": https_result_data,
        "uuid": 1,
        "scan_type": "https",
        "domain_key": domain["_key"],
    }

    test_client.post("/", json=test_payload)

    inserted_results_query = db.collection("https").all()

    inserted_results = inserted_results_query.next()

    for field in inserted_results:
        assert inserted_results.get(field, None) is not None
    assert inserted_results["guidanceTags"] == expected_https_tags


def test_insert_ssl():
    db = arango_client.db("test", username="", password="")
    domain_query = db.collection("domains").find({"domain": "cyber.gc.ca"}, limit=1)
    domain = domain_query.next()
    test_app = Server(
        db_host="http://testdb:8529", db_name="test", db_user="", db_pass=""
    )
    test_client = TestClient(test_app)

    test_payload = {
        "results": ssl_result_data,
        "uuid": 1,
        "scan_type": "ssl",
        "domain_key": domain["_key"],
    }

    test_client.post("/", json=test_payload)

    inserted_results_query = db.collection("ssl").all()

    inserted_results = inserted_results_query.next()

    for field in inserted_results:
        assert inserted_results.get(field, None) is not None
    assert inserted_results["guidanceTags"] == expected_ssl_tags


def test_insert_dns():
    db = arango_client.db("test", username="", password="")
    domain_query = db.collection("domains").find({"domain": "cyber.gc.ca"}, limit=1)
    domain = domain_query.next()
    test_app = Server(
        db_host="http://testdb:8529", db_name="test", db_user="", db_pass=""
    )
    test_client = TestClient(test_app)

    test_payload = {
        "results": dns_result_data,
        "uuid": 1,
        "scan_type": "dns",
        "domain_key": domain["_key"],
    }

    test_client.post("/", json=test_payload)

    inserted_dmarc_results_query = db.collection("dmarc").all()

    inserted_dmarc_results = inserted_dmarc_results_query.next()

    for field in inserted_dmarc_results:
        assert inserted_dmarc_results.get(field, None) is not None
    assert inserted_dmarc_results["guidanceTags"] == expected_dmarc_tags

    inserted_spf_results_query = db.collection("spf").all()

    inserted_spf_results = inserted_spf_results_query.next()

    for field in inserted_spf_results:
        assert inserted_spf_results.get(field, None) is not None
    assert inserted_spf_results["guidanceTags"] == expected_spf_tags

    inserted_dkim_results_query = db.collection("dkimResults").all()

    inserted_dkim_results = inserted_dkim_results_query.next()

    for field in inserted_dkim_results:
        assert inserted_dkim_results.get(field, None) is not None
    assert inserted_dkim_results["guidanceTags"] == expected_dkim_tags
