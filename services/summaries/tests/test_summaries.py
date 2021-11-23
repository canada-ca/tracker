import pytest
import datetime
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
graph = db.create_graph("compliance")
domains = graph.create_vertex_collection("domains")
orgs = graph.create_vertex_collection("organizations")

claims = graph.create_edge_definition(
    edge_collection="claims",
    from_vertex_collections=["organizations"],
    to_vertex_collections=["domains"],
)

org = orgs.insert(
    {
        "_key": "testorg",
        "verified": "true",
        "summaries": {
            "dmarc": {"pass": 0, "fail": 0, "total": 0},
            "web": {"pass": 0, "fail": 0, "total": 0},
            "mail": {"pass": 0, "fail": 0, "total": 0},
            "https": {"pass": 0, "fail": 0, "total": 0},
            "dmarc_phase": {"not_implemented": 0, "assess": 0, "deploy": 0,
                            "enforce": 0, "maintain": 0},

        },
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
    }
)

claims.insert({"_from": org["_id"], "_to": domain1["_id"]})
claims.insert({"_from": org["_id"], "_to": domain2["_id"]})
claims.insert({"_from": org["_id"], "_to": domain3["_id"]})


def test_update_scan_summaries():
    update_scan_summaries(host="testdb", name="test", user="", password="", port=8529)

    httpsScanSummary = db.collection("scanSummaries").get({"_key": "https"})
    assert httpsScanSummary == {
        "_id": "scanSummaries/https",
        "_rev": httpsScanSummary["_rev"],
        "_key": "https",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    sslScanSummary = db.collection("scanSummaries").get({"_key": "ssl"})
    assert sslScanSummary == {
        "_id": "scanSummaries/ssl",
        "_rev": sslScanSummary["_rev"],
        "_key": "ssl",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    dmarcScanSummary = db.collection("scanSummaries").get({"_key": "dmarc"})
    assert dmarcScanSummary == {
        "_id": "scanSummaries/dmarc",
        "_rev": dmarcScanSummary["_rev"],
        "_key": "dmarc",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    spfScanSummary = db.collection("scanSummaries").get({"_key": "spf"})
    assert spfScanSummary == {
        "_id": "scanSummaries/spf",
        "_rev": spfScanSummary["_rev"],
        "_key": "spf",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    dkimScanSummary = db.collection("scanSummaries").get({"_key": "dkim"})
    assert dkimScanSummary == {
        "_id": "scanSummaries/dkim",
        "_rev": dkimScanSummary["_rev"],
        "_key": "dkim",
        "pass": 1,
        "fail": 2,
        "total": 3,
    }


def test_update_chart_summaries():
    update_chart_summaries(host="testdb", name="test", user="", password="", port=8529)

    httpsSummary = db.collection("chartSummaries").get({"_key": "https"})
    assert httpsSummary == {
        "_id": "chartSummaries/https",
        "_rev": httpsSummary["_rev"],
        "_key": "https",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    webSummary = db.collection("chartSummaries").get({"_key": "web"})
    assert webSummary == {
        "_id": "chartSummaries/web",
        "_rev": webSummary["_rev"],
        "_key": "web",
        "pass": 2,
        "fail": 1,
        "total": 3,
    }

    mailSummary = db.collection("chartSummaries").get({"_key": "mail"})
    assert mailSummary == {
        "_id": "chartSummaries/mail",
        "_rev": mailSummary["_rev"],
        "_key": "mail",
        "pass": 1,
        "fail": 2,
        "total": 3,
    }

    dmarcPhaseSummary = db.collection("chartSummaries").get({"_key": "dmarc_phase"})
    assert dmarcPhaseSummary == {
        "_id": "chartSummaries/dmarc_phase",
        "_rev": dmarcPhaseSummary["_rev"],
        "_key": "dmarc_phase",
        "not_implemented": 1,
        "assess": 0,
        "deploy": 0,
        "enforce": 0,
        "maintain": 2,
        "total": 3,
    }


def test_update_org_summaries():
    update_org_summaries(host="testdb", name="test", user="", password="", port=8529)

    organization = db.collection("organizations").get({"_key": "testorg"})
    assert organization["summaries"] == {
        "dmarc": {"pass": 2, "fail": 1, "total": 3},
        "https": {"pass": 2, "fail": 1, "total": 3},
        "web": {"pass": 2, "fail": 1, "total": 3},
        "mail": {"pass": 1, "fail": 2, "total": 3},
        "dmarc_phase": {"not_implemented": 1, "assess": 0, "deploy": 0,
                        "enforce": 0, "maintain": 2, "total": 3},
    }
