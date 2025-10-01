import pytest
from datetime import datetime, timedelta, timezone
from arango import ArangoClient
from detect_decay import *
from config import DB_URL, DB_USER, DB_PASS, START_HOUR, START_MINUTE, MINIMUM_SCANS

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
        }
    ]
    claims = [
        {"_from": "organizations/1", "_to": "domains/1", "assetState": "approved"},
        {"_from": "organizations/1", "_to": "domains/2", "assetState": "approved"},
    ]

    times = []
    for i in range(MINIMUM_SCANS):
        times.append((datetime.now(timezone.utc) - timedelta(days=i+1)).replace(hour=20, minute=START_MINUTE, second=0, microsecond=0).isoformat(timespec='microseconds'))

    dns = [
        {   # Domain 1, DMARC decay
            "_id": "dns/11",
            "timestamp": times[0],
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/12",
            "timestamp": times[1],
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/13",
            "timestamp": times[2],
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/14",
            "timestamp": times[3],
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/15",
            "timestamp": times[4],
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {   # Domain 2, no decay
            "_id": "dns/21",
            "timestamp": times[0],
            "dmarc": {"status": "pass"},
            "spf": {"status": "fail"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/22",
            "timestamp": times[1],
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {   
            "_id": "dns/23",
            "timestamp": times[2],
            "dmarc": {"status": "fail"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {
            "_id": "dns/24",
            "timestamp": times[3],
            "dmarc": {"status": "pass"},
            "spf": {"status": "pass"},
            "dkim": {"status": "pass"},
        },
        {   
            "_id": "dns/25",
            "timestamp": times[4],
            "dmarc": {"status": "fail"},
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
            "_id": "domainsDNS/13",
            "_from": "domains/1",
            "_to": "dns/13"
        },
        {
            "_id": "domainsDNS/14",
            "_from": "domains/1",
            "_to": "dns/14"
        },
        {
            "_id": "domainsDNS/15",
            "_from": "domains/1",
            "_to": "dns/15"
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
            "_id": "domainsDNS/23",
            "_from": "domains/2",
            "_to": "dns/23"
        },
        {
            "_id": "domainsDNS/24",
            "_from": "domains/2",
            "_to": "dns/24"
        },
        {
            "_id": "domainsDNS/25",
            "_from": "domains/2",
            "_to": "dns/25"
        },
    ]
    web = [
        {"_id": "web/11", "timestamp": times[0]},
        {"_id": "web/12", "timestamp": times[1]},
        {"_id": "web/13", "timestamp": times[2]},
        {"_id": "web/14", "timestamp": times[3]},
        {"_id": "web/15", "timestamp": times[4]},
        {"_id": "web/21", "timestamp": times[0]},
        {"_id": "web/22", "timestamp": times[1]},
        {"_id": "web/23", "timestamp": times[2]},
        {"_id": "web/24", "timestamp": times[3]},
        {"_id": "web/25", "timestamp": times[4]},
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
            "_id": "domainsWeb/13",
            "_from": "domains/1",
            "_to": "web/13"
        },
        {
            "_id": "domainsWeb/14",
            "_from": "domains/1",
            "_to": "web/14"
        },
        {
            "_id": "domainsWeb/15",
            "_from": "domains/1",
            "_to": "web/15"
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
        },
        {
            "_id": "domainsWeb/23",
            "_from": "domains/2",
            "_to": "web/23"
        },
        {
            "_id": "domainsWeb/24",
            "_from": "domains/2",
            "_to": "web/24"
        },
        {
            "_id": "domainsWeb/25",
            "_from": "domains/2",
            "_to": "web/25"
        },
    ]
    webScan = [
        {   # Domain 1, no decay
            "_id": "webScan/11",
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
                "timestamp": times[0],
            }           
        },
        {   
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
                "timestamp": times[1],
            }
        },
        {   
            "_id": "webScan/13",
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
                "timestamp": times[2],
            }
        },
        {   
            "_id": "webScan/14",
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
                "timestamp": times[3],
            }
        },
        {   
            "_id": "webScan/15",
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
                "timestamp": times[4],
            }
        },
        {   # Domain 2, IP Address 1, HTTPS decay
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
                    "httpsStatus": "pass",
                    "hstsStatus": "pass",
                },
                "timestamp": times[0],
            }
        },
        {   # IP Address 2
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
                    "httpsStatus": "fail",
                    "hstsStatus": "pass",
                },
                "timestamp": times[0],
            }
        },
        {   
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
                    "httpsStatus": "fail",
                    "hstsStatus": "pass",
                },
                "timestamp": times[1],
            }
        },
        {   
            "_id": "webScan/213", 
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
                "timestamp": times[2],
            }
        },
        {   
            "_id": "webScan/214", 
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
                "timestamp": times[3],
            }
        },
        {   
            "_id": "webScan/215", 
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
                "timestamp": times[4],
            }
        },
    ]
    webToWebScans = [
        {   # Domain 1
            "_id": "webToWebScans/11",
            "_from": "web/11",
            "_to": "webScan/11"
        },
        {   
            "_id": "webToWebScans/12",
            "_from": "web/12",
            "_to": "webScan/12"
        },
        {   
            "_id": "webToWebScans/13",
            "_from": "web/13",
            "_to": "webScan/13"
        },
        {   
            "_id": "webToWebScans/14",
            "_from": "web/14",
            "_to": "webScan/14"
        },
        {   
            "_id": "webToWebScans/15",
            "_from": "web/15",
            "_to": "webScan/15"
        },
        {   # Domain 2, IP 1
            "_id": "webToWebScans/211",
            "_from": "web/21",
            "_to": "webScan/211"
        },
        {   # IP 2
            "_id": "webToWebScans/221",
            "_from": "web/21",
            "_to": "webScan/221"
        },
        {   
            "_id": "webToWebScans/212",
            "_from": "web/22",
            "_to": "webScan/212"
        },
        {   
            "_id": "webToWebScans/213",
            "_from": "web/23",
            "_to": "webScan/213"
        },
        {   
            "_id": "webToWebScans/214",
            "_from": "web/24",
            "_to": "webScan/214"
        },
        {   
            "_id": "webToWebScans/215",
            "_from": "web/25",
            "_to": "webScan/215"
        },
    ]
    users = [
        {   # Org 1 Owner
            "_id": "users/1",
            "displayName": "user1",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
            "emailUpdateOptions": {"detectDecay": True}
        },
        {   # Org 1 Admin
            "_id": "users/2",
            "displayName": "user2",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
            "emailUpdateOptions": {"detectDecay": True}
        },
        {   # Org 1 User
            "_id": "users/3",
            "displayName": "user3",
            "userName": "Sara.Jaffer@tbs-sct.gc.ca",
            "receiveEmailUpdates": True,
            "emailUpdateOptions": {"detectDecay": True}
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
    assert arango_db["domains"].count() == 2, "Should have 2 domains"
    assert arango_db["dns"].count() == 10, "Should have 10 DNS records"
    assert arango_db["web"].count() == 10, "Should have 10 web records"
    assert arango_db["webScan"].count() == 11, "Should have 11 web scans"
    assert arango_db["users"].count() == 3, "Should have 3 users"
    assert arango_db["claims"].count() == 2, "Should have 2 claims"
    assert arango_db["domainsDNS"].count() == 10, "Should have 10 domainsDNS edges"
    assert arango_db["domainsWeb"].count() == 10, "Should have 10 domainsWeb edges"
    assert arango_db["webToWebScans"].count() == 11, "Should have 11 webToWebScans edges"
    assert arango_db["affiliations"].count() == 3, "Should have 3 affiliations"

def test_get_all_dns_scans(arango_db):
    assert len(list(get_all_dns_scans("domains/1", arango_db))) == 5, "Should return 5 dns scans for domains/1"
    assert len(list(get_all_dns_scans("domains/2", arango_db))) == 5, "Should return 5 dns scans for domains/2"

def test_get_all_web_scans(arango_db):
    web_docs1 = list(get_all_web_scans("domains/1", arango_db))
    assert len(web_docs1) == 5, "Should return 5 web docs for domains/1"

    web_docs2 = list(get_all_web_scans("domains/2", arango_db))
    assert len(web_docs2) == 5, "Should return 5 web docs for domains/2"
    assert len(web_docs2[0].get("scans")) == 2

def test_get_users(arango_db):
    assert len(list(get_users("organizations/1", arango_db))) == 2, "Should return 2 users for organizations/1"

def test_detect_decay(arango_db):
    # Test that decays are detected correctly, use decays dict
    output = detect_decay(arango_db)
    decays = output[0]

    assert len(decays.keys()) == 1, "Should return 1 org"
    assert len(decays["Org 1"].keys()) == 2, "Should return 2 domains with decays for org 1"
    assert "domain1.gc.ca" in decays["Org 1"]
    assert "domain2.gc.ca" in decays["Org 1"]
    assert len(decays["Org 1"]["domain1.gc.ca"]) == 1, "Should return 1 decay for domain1.gc.ca"
    assert "DMARC" in decays["Org 1"]["domain1.gc.ca"]
    assert len(decays["Org 1"]["domain2.gc.ca"]) == 1, "Should return 1 decay for domain2.gc.ca"
    assert "HTTPS Configuration" in decays["Org 1"]["domain2.gc.ca"]
    
    # Test that send_email_notifs returns 2 responses for org 1 owner and admin
    responses = output[1]
    assert len(responses[0]) == 2, "Should return 2 responses for org 1 users"
    

