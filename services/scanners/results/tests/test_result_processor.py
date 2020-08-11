import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient
from result_processor import *
from test_data import *

TEST_DATABASE_URI = "postgresql://track_dmarc:postgres@testdb/track_dmarc"
engine = create_engine(TEST_DATABASE_URI)
test_app = Server(database_uri=TEST_DATABASE_URI)

session = sessionmaker(bind=engine, autocommit=True)
test_session = session()


def setup():
    scan_time = datetime.datetime.utcnow()
    with test_session.begin():
        test_session.execute(Users.insert().values(user_name="system", user_password="sysuserpass", display_name="system", preferred_lang="English"))
        test_session.execute(Domains.insert().values(domain="cyber.gc.ca", selectors=["selector1._domainkey"]))
        test_session.execute(Web_scans.insert().values(domain_id=1, scan_date=scan_time, initiated_by=1))
        test_session.execute(Mail_scans.insert().values(domain_id=1, scan_date=scan_time, selectors=["selector1._domainkey"], initiated_by=1))


async def test_process_and_insert_https():
    setup()

    test_client = TestClient(test_app)

    test_payload = {"results": https_result_data, "scan_id": 1, "scan_type": "https"}

    await test_client.post("/", json=test_payload)

    with test_session.begin():
        inserted_results = test_session.fetch_one(select([Https_scans]).where(Https_scans.c.id == 1))

    assert inserted_results.get("https_scan")["https"] is not None


async def test_process_and_insert_ssl():
    test_client = TestClient(test_app)

    test_payload = {"results": ssl_result_data, "scan_id": 1, "scan_type": "ssl"}

    await test_client.post("/", json=test_payload)

    with test_session.begin():
        inserted_results = test_session.fetch_one(select([Ssl_scans]).where(Ssl_scans.c.id == 1))

    assert inserted_results.get("ssl_scan")["ssl"] is not None


async def test_process_and_insert_dns():
    test_client = TestClient(test_app)

    test_payload = {"results": dns_result_data, "scan_id": 1, "scan_type": "dns"}

    await test_client.post("/", json=test_payload)

    with test_session.begin():
        inserted_dmarc_results = test_session.fetch_one(select([Dmarc_scans]).where(Dmarc_scans.c.id == 1))
        inserted_spf_results = test_session.fetch_one(select([Spf_scans]).where(Spf_scans.c.id == 1))
        inserted_mx_results = test_session.fetch_one(select([Mx_scans]).where(Mx_scans.c.id == 1))
        inserted_dkim_results = test_session.fetch_one(select([Dkim_scans]).where(Dkim_scans.c.id == 1))

    assert inserted_dmarc_results.get("dmarc_scan")["dmarc"] is not None
    assert inserted_spf_results.get("spf_scan")["spf"] is not None
    assert inserted_mx_results.get("mx_scan")["mx"] is not None
    assert inserted_dkim_results.get("dkim_scan")["dkim"] is not None
