import pytest
from pretend import stub
from starlette.testclient import TestClient
from result_processor import (
    Server,
    insert_dkim,
    insert_dmarc,
    insert_https,
    insert_ssl,
    process_https,
    process_dkim,
    process_dmarc,
    process_ssl,
)
from test_data import *


def test_insert_https():
    test_https = stub(
        insert=lambda results, scan_id, database: "HTTPS Scan inserted into database"
    )

    test_app = Server(
        functions={
            "insert": {
                "https": test_https.insert,
                "ssl": insert_ssl,
                "dmarc": insert_dmarc,
                "dkim": insert_dkim,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dmarc": process_dmarc,
                "dkim": process_dkim,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "https"}

    res = test_client.post("/process", payload=test_payload)

    assert (
        res.text == "Results processed successfully: HTTPS Scan inserted into database"
    )


def test_insert_ssl():
    test_ssl = stub(
        insert=lambda results, scan_id, database: "SSL Scan inserted into database"
    )

    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": test_ssl.insert,
                "dmarc": insert_dmarc,
                "dkim": insert_dkim,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dmarc": process_dmarc,
                "dkim": process_dkim,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "ssl"}

    res = test_client.post("/process", payload=test_payload)

    assert (
        res.text == "Results processed successfully: SSL Scan inserted into database"
    )


def test_insert_dmarc():
    test_dmarc = stub(
        insert=lambda results, scan_id, database: "DMARC Scan inserted into database"
    )

    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": insert_ssl,
                "dmarc": test_dmarc.insert,
                "dkim": insert_dkim,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dmarc": process_dmarc,
                "dkim": process_dkim,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "dmarc"}

    res = test_client.post("/process", payload=test_payload)

    assert (
        res.text == "Results processed successfully: DMARC Scan inserted into database"
    )


def test_insert_dkim():
    test_dkim = stub(
        insert=lambda results, scan_id, database: "DKIM Scan inserted into database"
    )

    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": insert_ssl,
                "dmarc": insert_dmarc,
                "dkim": test_dkim.insert,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dmarc": process_dmarc,
                "dkim": process_dkim,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "dkim"}

    res = test_client.post("/process", payload=test_payload)

    assert (
        res.text == "Results processed successfully: DKIM Scan inserted into database"
    )

