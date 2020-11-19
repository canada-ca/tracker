import pytest
import datetime
from arango import ArangoClient
from core import *
from test_data import *

arango_client = ArangoClient(hosts="http://testdb:8529")
# Connect to arango system DB and create test DB
sys_db = arango_client.db("_system", username="", password="")
sys_db.create_database("test")

# Establish DB connection
db = arango_client.db("test", username="", password="")
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
            "web": {"pass": 0, "fail": 0, "total": 0},
            "mail": {"pass": 0, "fail": 0, "total": 0},
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


def test_update_guidance():
    test_guidance = []
    test_guidance.append(
        {"file": "scanSummaryCriteria", "guidance": scan_summary_criteria_data}
    )
    test_guidance.append(
        {"file": "chartSummaryCriteria", "guidance": chart_summary_criteria_data}
    )
    test_guidance.append({"file": "tags_dkim", "guidance": dkim_tag_data})
    test_guidance.append({"file": "tags_dmarc", "guidance": dmarc_tag_data})
    test_guidance.append({"file": "tags_spf", "guidance": spf_tag_data})
    test_guidance.append({"file": "tags_https", "guidance": https_tag_data})
    test_guidance.append({"file": "tags_ssl", "guidance": ssl_tag_data})
    test_guidance.append({"file": "tags_aggregate", "guidance": aggregate_tag_data})
    update_guidance(
        test_guidance, host="http://testdb:8529", name="test", user="", password=""
    )
    for key, data in scan_summary_criteria_data.items():
        test_criteria = {"_key": key}
        for k, v in data.items():
            test_criteria[k] = v
        current_criteria = db.collection("scanSummaryCriteria").get({"_key": key})
        assert test_criteria == {
            "_key": current_criteria["_key"],
            "pass": current_criteria["pass"],
            "fail": current_criteria["fail"],
            "info": current_criteria["info"],
            "warning": current_criteria["warning"],
        }

    for key, data in chart_summary_criteria_data.items():
        test_criteria = {"_key": key}
        for k, v in data.items():
            test_criteria[k] = v
        current_criteria = db.collection("chartSummaryCriteria").get({"_key": key})
        assert test_criteria == {
            "_key": current_criteria["_key"],
            "pass": current_criteria["pass"],
            "fail": current_criteria["fail"],
        }

    for key, data in dkim_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("dkimGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }

    for key, data in dmarc_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("dmarcGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }

    for key, data in spf_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("spfGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }

    for key, data in https_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("httpsGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }

    for key, data in ssl_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("sslGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }

    for key, data in aggregate_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("aggregateGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "tagName": current_tag["tagName"],
            "guidance": current_tag["guidance"],
            "refLinksGuide": current_tag["refLinksGuide"],
            "refLinksTechnical": current_tag["refLinksTechnical"],
        }


def test_update_scan_summaries():
    update_scan_summaries(host="http://testdb:8529", name="test", user="", password="")

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
    update_chart_summaries(host="http://testdb:8529", name="test", user="", password="")

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


def test_update_org_summaries():
    update_org_summaries(host="http://testdb:8529", name="test", user="", password="")

    organization = db.collection("organizations").get({"_key": "testorg"})
    assert organization["summaries"] == {
        "web": {"pass": 2, "fail": 1, "total": 3},
        "mail": {"pass": 1, "fail": 2, "total": 3},
    }
