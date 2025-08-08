import pytest
from datetime import datetime, timedelta, timezone
import os
from arango import ArangoClient
from dotenv import load_dotenv
load_dotenv()
from detect_decay import *


DB_URL = os.getenv("DB_URL", "http://localhost:8529")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "test")
START_HOUR = int(os.getenv("START_HOUR"))  
START_MINUTE = int(os.getenv("START_MINUTE"))

@pytest.fixture()
def arango_db():
    # Connect to arango system DB and create test DB
    arango_client = ArangoClient(hosts=DB_URL)
    sys_db = arango_client.db("_system", username=DB_USER, password=DB_PASS)
    db_name = "test_detect_decay"
    if sys_db.has_database(db_name):
        sys_db.delete_database(db_name)
    sys_db.create_database(db_name)
    db = arango_client.db(db_name, username=DB_USER, password=DB_PASS)
    orgs = [
        {
            "_id": "organizations/1",
            "_key": "1",
            "verified": True,
            "orgDetails": {
                "en": {
                    "slug":"org-one",
                    "acronym":"ORG1",
                    "name": "Org 1",
                    "zone": "Ottawa",
                    "sector": "Ottawa",
                    "country": "Canada",
                    "province": "Ontario",
                    "city": "Ottawa",
                },
                "fr": {
                    "slug":"org-un",
                    "acronym":"ORG1",
                    "name": "Org 1",
                    "zone": "Ottawa",
                    "sector": "Ottawa",
                    "country": "Canada",
                    "province": "Ontario",
                    "city": "Ottawa",
                },
            },
        },
        {
            "_id": "organizations/2",
            "_key": "2",
            "verified": False,
            "orgDetails": {
                "en": {
                    "slug":"org-two",
                    "acronym":"ORG2",
                    "name": "Org 2",
                    "zone": "Ottawa",
                    "sector": "Ottawa",
                    "country": "Canada",
                    "province": "Ontario",
                    "city": "Ottawa",
                },
                "fr": {
                    "slug":"org-deux",
                    "acronym":"ORG2",
                    "name": "Org 2",
                    "zone": "Ottawa",
                    "sector": "Ottawa",
                    "country": "Canada",
                    "province": "Ontario",
                    "city": "Ottawa",
                },
            },
        }
    ]
    domains = [
        {
            "_id": "domains/1",
            "domain": "domain1.gc.ca",
            "archived": False,
            "blocked": False,
            "rcode": "NOERROR"
        },
        {
            "_id": "domains/2",
            "domain": "domain2.gc.ca",
            "archived": False,
            "blocked": False,
            "rcode": "NOERROR"
        },
        {
            "_id": "domains/3",
            "domain": "domain3.gc.ca",
            "archived": True,
            "blocked": False,
            "rcode": "NOERROR"
        },
        {
            "_id": "domains/4",
            "domain": "domain4.gc.ca",
            "archived": False,
            "blocked": False,
            "rcode": "NOERROR"
        }
    ]
    claims = [
        {"_from": "organizations/1", "_to": "domains/1", "assetState": "approved"},
        {"_from": "organizations/1", "_to": "domains/2", "assetState": "approved"},
        {"_from": "organizations/1", "_to": "domains/3", "assetState": "approved"},
        {"_from": "organizations/2", "_to": "domains/4", "assetState": "approved"},
    ]
    now = datetime.now(timezone.utc).isoformat(timespec='microseconds')
    past = (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=17, minute=0, second=0, microsecond=0).isoformat(timespec='microseconds')
    dns = [
        {
            "_id": "dns/11",
            "timestamp": now,
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/12",
            "timestamp": past,
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/21",
            "timestamp": now,
            "dmarc": {"status": "pass"},
            "spf": {"status": "fail"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/22",
            "timestamp": past,
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {   # Archived domain, should be ignored despite having decay
            "_id": "dns/31",
            "timestamp": now,
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/32",
            "timestamp": past,
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {   # Domain 4 from unverifified org, should be ignored
            "_id": "dns/41",
            "timestamp": now,
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/42",
            "timestamp": past,
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        }
    ]
    domainsDNS = [
        {
            "_id": "domainsDNS/11", 
            "_from": "domains/1",
            "_to": "dns/11"
        },
        {
            "_id": "domainsDNS/12",
            "_from": "domains/1",
            "_to": "dns/12"
        },
        {
            "_id": "domainsDNS/21",
            "_from": "domains/2",
            "_to": "dns/21"
        },
        {
            "_id": "domainsDNS/22",
            "_from": "domains/2",
            "_to": "dns/22"
        },
        {
            "_id": "domainsDNS/31",
            "_from": "domains/3",
            "_to": "dns/31"
        },
        {
            "_id": "domainsDNS/32",
            "_from": "domains/3",
            "_to": "dns/32"
        },
        {
            "_id": "domainsDNS/41",
            "_from": "domains/4",
            "_to": "dns/41"
        },
        {
            "_id": "domainsDNS/42",
            "_from": "domains/4",
            "_to": "dns/42"
        },
    ]
    web = [
        {"_id": "web/11", "timestamp": now},
        {"_id": "web/12", "timestamp": past},
        {"_id": "web/21", "timestamp": now},
        {"_id": "web/22", "timestamp": past}
    ]
    domainsWeb = [
        {
            "_id": "domainsWeb/11",
            "_from": "domains/1",
            "_to": "web/11"
        },
        {
            "_id": "domainsWeb/12",
            "_from": "domains/1",
            "_to": "web/12"
        },
        {
            "_id": "domainsWeb/21",
            "_from": "domains/2",
            "_to": "web/21"
        },
        {
            "_id": "domainsWeb/22",
            "_from": "domains/2",
            "_to": "web/22"
        }
    ]
    webScan = [
        {   # Domain 1, first scan, Certificate decay
            "_id": "webScan/11",
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "fail",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": now,
            }           
        },
        {   # Domain 1, second scan
            "_id": "webScan/12",
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "pass",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": past,
            }
        },
        {   # Domain 2, IP Address 1, first scan, HTTPS decay
            "_id": "webScan/211", 
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "pass",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "fail",
                    "hstsStatus": "pass",
                },
                "timestamp": now,
            }
        },
        {   # Domain 2, IP Address 1, second scan
            "_id": "webScan/212", 
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "pass",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": past,
            }
        },
        {   # Domain 2, IP Address 2, first scan, no decay
            "_id": "webScan/221", 
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "pass",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": now,
            }
        },
        {   # Domain 2, IP Address 2, second scan
            "_id": "webScan/222", 
            "status": "complete",
            "results": {
                "tlsResult": {
                    "sslStatus": "pass",
                    "certificateStatus": "pass",
                    "protocolStatus": "pass",
                    "cipherStatus": "pass",
                    "curveStatus": "pass",
                },
                "connectionResults": {
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": past,
            }
        }
    ]
    webToWebScans = [
        {   # Domain 1, first scan
            "_id": "webToWebScans/11",
            "_from": "web/11",
            "_to": "webScan/11"
        },
        {   # Domain 1, second scan
            "_id": "webToWebScans/12",
            "_from": "web/12",
            "_to": "webScan/12"
        },
        {   # Domain 2, IP 1, first scan
            "_id": "webToWebScans/211",
            "_from": "web/21",
            "_to": "webScan/211"
        },
        {   # Domain 2, IP 1, second scan
            "_id": "webToWebScans/212",
            "_from": "web/22",
            "_to": "webScan/212"
        },
        {   # Domain 2, IP 2, first scan
            "_id": "webToWebScans/221",
            "_from": "web/21",
            "_to": "webScan/221"
        },
        {   # Domain 2, IP 2, second scan
            "_id": "webToWebScans/222",
            "_from": "web/22",
            "_to": "webScan/222"
        }
    ]
    users = [
        {   # Org 1 Owner
            "_id": "users/1",
            "displayName": "user1",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
        },
        {   # Org 1 Admin
            "_id": "users/2",
            "displayName": "user2",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
        },
        {   # Org 1 User
            "_id": "users/3",
            "displayName": "user3",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
        }
    ]
    affiliations = [
        {
            "_id": "affiliations/1",
            "_from": "organizations/1",
            "_to": "users/1",
            "permission": "owner"
        },
        {
            "_id": "affiliations/2",
            "_from": "organizations/1",
            "_to": "users/2",
            "permission": "admin"
        },
        {
            "_id": "affiliations/3",
            "_from": "organizations/1",
            "_to": "users/3",
            "permission": "user"
        }
    ]
    # Create collections and insert documents
    for collection, doc in {
        "organizations": orgs,
        "domains": domains,
        "dns": dns,
        "web": web,
        "webScan": webScan,
        "users": users
    }.items():
        db.create_collection(collection)
        db.collection(collection).insert_many(doc)
    for collection, doc in {
        "claims": claims,
        "domainsDNS": domainsDNS,
        "domainsWeb": domainsWeb,
        "webToWebScans": webToWebScans,
        "affiliations": affiliations
    }.items():
        db.create_collection(collection, edge=True)
        db.collection(collection).insert_many(doc)
    
    yield db
    sys_db.delete_database(db_name)

def test_db_data(arango_db):
    assert arango_db["organizations"].count() == 2, "Should have 2 organizations"
    assert arango_db["domains"].count() == 4, "Should have 4 domains"
    assert arango_db["dns"].count() == 8, "Should have 8 DNS records"
    assert arango_db["web"].count() == 4, "Should have 4 web records"
    assert arango_db["webScan"].count() == 6, "Should have 6 web scans"
    assert arango_db["users"].count() == 3, "Should have 3 users"
    assert arango_db["claims"].count() == 4, "Should have 4 claims"
    assert arango_db["domainsDNS"].count() == 8, "Should have 8 domainsDNS edges"
    assert arango_db["domainsWeb"].count() == 4, "Should have 4 domainsWeb edges"
    assert arango_db["webToWebScans"].count() == 6, "Should have 6 webToWebScans edges"
    assert arango_db["affiliations"].count() == 3, "Should have 3 affiliations"

    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'organizations/1' claims
                    RETURN v
                """,
                count=True,
            ).count()
            == 3
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'organizations/2' claims
                    RETURN v
                """,
                count=True,
            ).count()
            == 1
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'organizations/1' affiliations
                    RETURN v
                """,
                count=True,
            ).count()
            == 3
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/1' domainsDNS
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/2' domainsDNS
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/3' domainsDNS
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/4' domainsDNS
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/1' domainsWeb
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'domains/2' domainsWeb
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'web/11' webToWebScans
                    RETURN v
                """,
                count=True,
            ).count()
            == 1
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'web/12' webToWebScans
                    RETURN v
                """,
                count=True,
            ).count()
            == 1
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'web/21' webToWebScans
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )
    assert (
            arango_db.aql.execute(
                """
                FOR v, e IN 1..1 OUTBOUND 'web/22' webToWebScans
                    RETURN v
                """,
                count=True,
            ).count()
            == 2
        )


def test_ignore_domain():
    assert ignore_domain({"archived": True}) is True, "Should return True for archived domain"
    assert ignore_domain({"blocked": True}) is True, "Should return True for blocked domain"
    assert ignore_domain({"rcode": "NXDOMAIN"}) is True, "Should return True for NXDOMAIN"
    assert ignore_domain({"archived": False, "blocked": False, "rcode": "NOERROR"}) is False, "Should return False for valid domain"

def test_get_all_dns_scans(arango_db):
    assert len(list(get_all_dns_scans("domains/1", arango_db))) == 2, "Should return 2 dns scans for domains/1"
    assert len(list(get_all_dns_scans("domains/2", arango_db))) == 2, "Should return 2 dns scans for domains/2"

def test_get_all_web_scans(arango_db):
    web_docs1 = list(get_all_web_scans("domains/1", arango_db))
    assert len(web_docs1) == 2, "Should return 2 web docs for domains/1"
    assert len(web_docs1[0].get("scans")) == 1
    assert len(web_docs1[1].get("scans")) == 1


    web_docs2 = list(get_all_web_scans("domains/2", arango_db))
    assert len(web_docs2) == 2, "Should return 2 web docs for domains/2"
    assert len(web_docs2[0].get("scans")) == 2
    assert len(web_docs2[1].get("scans")) == 2

def test_get_status():
    assert get_status(["fail", "fail"]) == "fail", "Should return fail"
    assert get_status(["pass", "fail"]) == "fail", "Should return fail"
    assert get_status(["pass", "pass"]) == "pass", "Should return pass"
    assert get_status(["info", "pass"]) == "pass", "Should return pass"
    assert get_status(["info", "info"]) == "info", "Should return info"

def test_finalize_web_scans():
    assert finalize_web_scans([
        {"https_status": "fail", "hsts_status": "pass", "certificate_status": "pass", "protocol_status": "pass", "cipher_status": "info", "curve_status": "pass"},
        {"https_status": "fail", "hsts_status": "fail", "certificate_status": "pass", "protocol_status": "info", "cipher_status": "info", "curve_status": "pass"}
    ]) == {"https_status": "fail", "hsts_status": "fail", "certificate_status": "pass", "protocol_status": "pass", "cipher_status": "info", "curve_status": "pass"}

def test_get_users(arango_db):
    assert len(list(get_users("organizations/1", arango_db))) == 2, "Should return 2 users for organizations/1"

def test_detect_decay(arango_db):
    # Test that decays are detected correctly, use decays dict
    output = detect_decay(arango_db)
    decays = output[0]

    assert len(decays.keys()) == 1, "Should return 1 org"
    assert len(decays["organizations/1"].keys()) == 2, "Should return 2 domains with decays for org 1"
    assert "domain1.gc.ca" in decays["organizations/1"]
    assert "domain2.gc.ca" in decays["organizations/1"]
    assert len(decays["organizations/1"]["domain1.gc.ca"]) == 2, "Should return 2 decays for domain1.gc.ca"
    assert "Certificates" in decays["organizations/1"]["domain1.gc.ca"]
    assert "DMARC" in decays["organizations/1"]["domain1.gc.ca"]
    assert len(decays["organizations/1"]["domain2.gc.ca"]) == 2, "Should return 2 decays for domain2.gc.ca"
    assert "HTTPS Configuration" in decays["organizations/1"]["domain2.gc.ca"]
    assert "SPF" in decays["organizations/1"]["domain2.gc.ca"]
    
    # Test that send_email_notifs returns 2 responses for org 1 owner and admin
    responses = output[1]
    assert len(responses[0]) == 2, "Should return 2 responses for org 1 users"
    

