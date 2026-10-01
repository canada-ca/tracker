import os

import pytest
from datetime import date, timedelta
from arango import ArangoClient
from dotenv import load_dotenv

from scan_summaries import run_backfill

load_dotenv(os.path.join(os.path.dirname(__file__), "test.env"))

DB_URL = os.getenv("DB_URL", "http://localhost:8530")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "test")

TODAY = date.today().isoformat()
TIMESTAMP = f"{TODAY} 12:00:00.000000+00:00"


def dns_doc(domain, dmarc, spf, dkim, phase):
    return {
        "domain": domain,
        "timestamp": TIMESTAMP,
        "rcode": "NOERROR",
        "dmarc": {"status": dmarc, "phase": phase, "negativeTags": []},
        "spf": {"status": spf, "negativeTags": []},
        "dkim": {"status": dkim, "negativeTags": []},
    }


def web_scan_results(https, hsts, ssl):
    return {
        "status": "complete",
        "results": {
            "connectionResults": {"httpsStatus": https, "hstsStatus": hsts, "negativeTags": []},
            "tlsResult": {"sslStatus": ssl, "negativeTags": []},
        },
    }


class TestScanSummaries:
    @pytest.fixture
    def arango_db(self):
        arango_client = ArangoClient(hosts=DB_URL)
        sys_db = arango_client.db("_system", username=DB_USER, password=DB_PASS)

        db_name = os.path.basename(__file__).split(".")[0]
        if sys_db.has_database(db_name):
            sys_db.delete_database(db_name)
        sys_db.create_database(db_name)

        db = arango_client.db(db_name, username=DB_USER, password=DB_PASS)
        dns = db.create_collection("dns")
        web = db.create_collection("web")
        web_scan = db.create_collection("webScan")
        graph = db.create_graph("compliance")
        domains = graph.create_vertex_collection("domains")
        orgs = graph.create_vertex_collection("organizations")
        claims = graph.create_edge_definition(
            edge_collection="claims",
            from_vertex_collections=["organizations"],
            to_vertex_collections=["domains"],
        )
        web_to_web_scans = graph.create_edge_definition(
            edge_collection="webToWebScans",
            from_vertex_collections=["web"],
            to_vertex_collections=["webScan"],
        )

        org = orgs.insert(
            {
                "_key": "tbs",
                "verified": True,
                "policies": {"psd": True, "pgs": False},
                "orgDetails": {"en": {"name": "Treasury Board of Canada Secretariat"}},
            }
        )

        specs = [
            ("tbs1.gc.ca", "pass", "pass", "fail", "not implemented", "pass", "pass", "pass"),
            ("tbs2.gc.ca", "pass", "pass", "pass", "maintain", "pass", "pass", "pass"),
            ("tbs3.gc.ca", "fail", "fail", "fail", "maintain", "fail", "fail", "fail"),
        ]
        for name, dmarc, spf, dkim, phase, https, hsts, ssl in specs:
            domain = domains.insert({"domain": name, "archived": False, "blocked": False})
            claims.insert({"_from": org["_id"], "_to": domain["_id"], "assetState": "approved"})
            dns.insert(dns_doc(name, dmarc, spf, dkim, phase))
            web_entry = web.insert({"domain": name, "timestamp": TIMESTAMP})
            scan = web_scan.insert(web_scan_results(https, hsts, ssl))
            web_to_web_scans.insert({"_from": web_entry["_id"], "_to": scan["_id"]})

        yield db

        sys_db.delete_database(db_name)

    def test_chart_rebuild_matches_domain_based_output(self, arango_db):
        db_name = os.path.basename(__file__).split(".")[0]
        run_backfill(host=DB_URL, name=db_name, user=DB_USER, password=DB_PASS, target="shadow")

        chart_summaries = arango_db.collection("chartSummaries_rebuild")

        def get_scope(scope):
            summary = chart_summaries.find({"date": TODAY, "scope": scope}).next()
            for k in ("_id", "_key", "_rev"):
                summary.pop(k, None)
            return summary

        populated = {
            "date": TODAY,
            "https": {"scan_types": ["https"], "pass": 2, "fail": 1, "total": 3},
            "dmarc": {"scan_types": ["dmarc"], "pass": 2, "fail": 1, "total": 3},
            "web_connections": {"scan_types": ["https", "hsts"], "pass": 2, "fail": 1, "total": 3},
            "ssl": {"scan_types": ["ssl"], "pass": 2, "fail": 1, "total": 3},
            "spf": {"scan_types": ["spf"], "pass": 2, "fail": 1, "total": 3},
            "dkim": {"scan_types": ["dkim"], "pass": 1, "fail": 2, "total": 3},
            "mail": {"scan_types": ["dmarc", "spf", "dkim"], "pass": 1, "fail": 2, "total": 3},
            "web": {"scan_types": ["https", "hsts", "ssl"], "pass": 2, "fail": 1, "total": 3},
            "dmarc_phase": {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 2, "total": 2},
        }

        for scope in ("all", "verified", "psd"):
            assert get_scope(scope) == {**populated, "scope": scope}

        assert get_scope("pgs") == {
            "date": TODAY,
            "scope": "pgs",
            "https": {"scan_types": ["https"], "pass": 0, "fail": 0, "total": 0},
            "dmarc": {"scan_types": ["dmarc"], "pass": 0, "fail": 0, "total": 0},
            "web_connections": {"scan_types": ["https", "hsts"], "pass": 0, "fail": 0, "total": 0},
            "ssl": {"scan_types": ["ssl"], "pass": 0, "fail": 0, "total": 0},
            "spf": {"scan_types": ["spf"], "pass": 0, "fail": 0, "total": 0},
            "dkim": {"scan_types": ["dkim"], "pass": 0, "fail": 0, "total": 0},
            "mail": {"scan_types": ["dmarc", "spf", "dkim"], "pass": 0, "fail": 0, "total": 0},
            "web": {"scan_types": ["https", "hsts", "ssl"], "pass": 0, "fail": 0, "total": 0},
            "dmarc_phase": {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 0, "total": 0},
        }

    def test_org_rebuild_matches_domain_based_output(self, arango_db):
        db_name = os.path.basename(__file__).split(".")[0]
        run_backfill(host=DB_URL, name=db_name, user=DB_USER, password=DB_PASS, target="shadow")

        summary = (
            arango_db.collection("organizationSummaries_rebuild")
            .find({"organization": "organizations/tbs", "date": TODAY})
            .next()
        )
        for k in ("_id", "_key", "_rev"):
            summary.pop(k, None)

        assert summary == {
            "organization": "organizations/tbs",
            "date": TODAY,
            "dmarc": {"pass": 2, "fail": 1, "total": 3},
            "https": {"pass": 2, "fail": 1, "total": 3},
            "web": {"pass": 2, "fail": 1, "total": 3},
            "mail": {"pass": 1, "fail": 2, "total": 3},
            "web_connections": {"pass": 2, "fail": 1, "total": 3},
            "ssl": {"pass": 2, "fail": 1, "total": 3},
            "dkim": {"pass": 1, "fail": 2, "total": 3},
            "spf": {"pass": 2, "fail": 1, "total": 3},
            "dmarc_phase": {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 2, "total": 2},
            "negative_tags": {},
        }


YESTERDAY = (date.today() - timedelta(days=1)).isoformat()


class TestCarryForwardWebStatus:
    """A day with no completed web scan should carry the prior web status forward,
    not reset https/hsts/ssl to 'info' and drop the domain from the totals."""

    @pytest.fixture
    def arango_db(self):
        arango_client = ArangoClient(hosts=DB_URL)
        sys_db = arango_client.db("_system", username=DB_USER, password=DB_PASS)

        db_name = "test_scan_summaries_carry"
        if sys_db.has_database(db_name):
            sys_db.delete_database(db_name)
        sys_db.create_database(db_name)

        db = arango_client.db(db_name, username=DB_USER, password=DB_PASS)
        dns = db.create_collection("dns")
        web = db.create_collection("web")
        web_scan = db.create_collection("webScan")
        graph = db.create_graph("compliance")
        domains = graph.create_vertex_collection("domains")
        orgs = graph.create_vertex_collection("organizations")
        claims = graph.create_edge_definition(
            edge_collection="claims",
            from_vertex_collections=["organizations"],
            to_vertex_collections=["domains"],
        )
        web_to_web_scans = graph.create_edge_definition(
            edge_collection="webToWebScans",
            from_vertex_collections=["web"],
            to_vertex_collections=["webScan"],
        )

        org = orgs.insert(
            {
                "_key": "tbs",
                "verified": True,
                "policies": {"psd": False, "pgs": False},
                "orgDetails": {"en": {"name": "Treasury Board of Canada Secretariat"}},
            }
        )
        domain = domains.insert({"domain": "keep.gc.ca", "archived": False, "blocked": False})
        claims.insert({"_from": org["_id"], "_to": domain["_id"], "assetState": "approved"})

        def add_dns(day):
            dns.insert(dns_doc("keep.gc.ca", "pass", "pass", "pass", "maintain") | {"timestamp": f"{day} 12:00:00.000000+00:00"})

        def add_web(day, scan_status):
            web_entry = web.insert({"domain": "keep.gc.ca", "timestamp": f"{day} 12:00:00.000000+00:00"})
            scan = web_scan.insert(web_scan_results("pass", "pass", "pass") | {"status": scan_status})
            web_to_web_scans.insert({"_from": web_entry["_id"], "_to": scan["_id"]})

        # Yesterday: full dns + completed web scan (https/hsts/ssl = pass)
        add_dns(YESTERDAY)
        add_web(YESTERDAY, "complete")
        # Today: dns scan again, but the web scan is still pending (not complete)
        add_dns(TODAY)
        add_web(TODAY, "pending")

        yield db

        sys_db.delete_database(db_name)

    def test_incomplete_web_scan_carries_previous_status_forward(self, arango_db):
        run_backfill(host=DB_URL, name="test_scan_summaries_carry", user=DB_USER, password=DB_PASS, target="shadow")

        summary = (
            arango_db.collection("organizationSummaries_rebuild")
            .find({"organization": "organizations/tbs", "date": TODAY})
            .next()
        )
        for k in ("_id", "_key", "_rev"):
            summary.pop(k, None)

        # Web metrics still show yesterday's pass, not a dropped/reset domain.
        assert summary == {
            "organization": "organizations/tbs",
            "date": TODAY,
            "dmarc": {"pass": 1, "fail": 0, "total": 1},
            "https": {"pass": 1, "fail": 0, "total": 1},
            "web": {"pass": 1, "fail": 0, "total": 1},
            "mail": {"pass": 1, "fail": 0, "total": 1},
            "web_connections": {"pass": 1, "fail": 0, "total": 1},
            "ssl": {"pass": 1, "fail": 0, "total": 1},
            "dkim": {"pass": 1, "fail": 0, "total": 1},
            "spf": {"pass": 1, "fail": 0, "total": 1},
            "dmarc_phase": {"assess": 0, "deploy": 0, "enforce": 0, "maintain": 1, "total": 1},
            "negative_tags": {},
        }
