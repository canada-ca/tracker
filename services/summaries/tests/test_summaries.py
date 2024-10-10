import pytest
from datetime import date
from arango import ArangoClient
from summaries import *
from test_data import *

arango_client = ArangoClient(hosts="http://testdb:8529")
# Connect to arango system DB and create test DB
sys_db = arango_client.db("_system", username="", password="")
sys_db.create_database("test")

# Establish DB connection
db = arango_client.db("test", username="", password="")
db.create_collection("scanSummaries")
db.create_collection("chartSummaries")
db.create_collection("organizationSummaries")
db.create_collection("dns")
db.create_collection("web")
db.create_collection("webScan")
graph = db.create_graph("compliance")
domains = graph.create_vertex_collection("domains")
orgs = graph.create_vertex_collection("organizations")

claims = graph.create_edge_definition(
    edge_collection="claims",
    from_vertex_collections=["organizations"],
    to_vertex_collections=["domains"],
)
domains_dns = graph.create_edge_definition(
    edge_collection="domainsDNS",
    from_vertex_collections=["domains"],
    to_vertex_collections=["dns"],
)
domains_web = graph.create_edge_definition(
    edge_collection="domainsWeb",
    from_vertex_collections=["domains"],
    to_vertex_collections=["web"],
)
web_to_web_scans = graph.create_edge_definition(
    edge_collection="webToWebScans",
    from_vertex_collections=["web"],
    to_vertex_collections=["webScan"],
)

org = orgs.insert(
    {
        "_key": "testorg",
        "verified": True,
        "summaries": {
            "dmarc": {"pass": 0, "fail": 0, "total": 0},
            "web": {"pass": 0, "fail": 0, "total": 0},
            "mail": {"pass": 0, "fail": 0, "total": 0},
            "https": {"pass": 0, "fail": 0, "total": 0},
            "web_connections": {"pass": 0, "fail": 0, "total": 0},
            "ssl": {"pass": 0, "fail": 0, "total": 0},
            "dkim": {"pass": 0, "fail": 0, "total": 0},
            "spf": {"pass": 0, "fail": 0, "total": 0},
            "dmarc_phase": {
                "not_implemented": 0,
                "assess": 0,
                "deploy": 0,
                "enforce": 0,
                "maintain": 0,
            },
        },
        "hist_summaries": [],
        "orgDetails": {
            "en": {
                "slug": "communications-security-establishment",
                "acronym": "CSE",
                "name": "Communications Security Establishment",
                "zone": "FED",
                "sector": "DND",
                "country": "Canada",
                "province": "Ontario",
                "city": "Ottawa",
            },
            "fr": {
                "slug": "centre-de-la-securite-des-telecommunications",
                "acronym": "CST",
                "name": "Centre de la Securite des Telecommunications",
                "zone": "FED",
                "sector": "DND",
                "country": "Canada",
                "province": "Ontario",
                "city": "Ottawa",
            },
        },
    }
)

domain1 = domains.insert(
    {
        "domain": "cyber1.gc.ca",
        "selectors": ["selector1"],
        "phase": "not implemented",
        "status": {
            "https": "pass",
            "ssl": "pass",
            "dmarc": "pass",
            "spf": "pass",
            "dkim": "fail",
        },
        "archived": False,
    }
)
domain2 = domains.insert(
    {
        "domain": "cyber2.gc.ca",
        "selectors": ["selector1"],
        "phase": "maintain",
        "status": {
            "https": "pass",
            "ssl": "pass",
            "dmarc": "pass",
            "spf": "pass",
            "dkim": "pass",
        },
        "archived": False,
    }
)
domain3 = domains.insert(
    {
        "domain": "cyber3.gc.ca",
        "selectors": ["selector1"],
        "phase": "maintain",
        "status": {
            "https": "fail",
            "ssl": "fail",
            "dmarc": "fail",
            "spf": "fail",
            "dkim": "fail",
        },
        "archived": False,
    }
)

claims.insert({"_from": org["_id"], "_to": domain1["_id"], "assetState": "approved"})
claims.insert({"_from": org["_id"], "_to": domain2["_id"], "assetState": "approved"})
claims.insert({"_from": org["_id"], "_to": domain3["_id"], "assetState": "approved"})


def test_update_chart_summaries():
    update_chart_summaries(host="http://testdb:8529", name="test", user="", password="")

    summary = db.collection("chartSummaries").all().next()
    assert summary["https"] == {
        "scan_types": ["https"],
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    assert summary["web"] == {
        "scan_types": ["https", "hsts", "ssl"],
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    assert summary["mail"] == {
        "scan_types": ["dmarc", "spf", "dkim"],
        "pass": 1,
        "fail": 2,
        "total": 3,
    }

    assert summary["dmarc_phase"] == {
        "not_implemented": 1,
        "assess": 0,
        "deploy": 0,
        "enforce": 0,
        "maintain": 2,
        "total": 3,
    }


def test_update_org_summaries():
    update_org_summaries(host="http://testdb:8529", name="test", user="", password="")

    organization = db.collection("organizations").get({"_key": "testorg"})
    assert organization["summaries"] == {
        "date": date.today().isoformat(),
        "dmarc": {"pass": 2, "fail": 1, "total": 3},
        "https": {"pass": 2, "fail": 1, "total": 3},
        "web": {"pass": 2, "fail": 1, "total": 3},
        "mail": {"pass": 1, "fail": 2, "total": 3},
        "web_connections": {"pass": 0, "fail": 1, "total": 1},
        "ssl": {"pass": 2, "fail": 1, "total": 3},
        "dkim": {"pass": 1, "fail": 2, "total": 3},
        "spf": {"pass": 2, "fail": 1, "total": 3},
        "dmarc_phase": {
            "not_implemented": 1,
            "assess": 0,
            "deploy": 0,
            "enforce": 0,
            "maintain": 2,
            "total": 3,
        },
        "negative_tags": {},
    }
