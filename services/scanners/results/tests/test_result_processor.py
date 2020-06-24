import pytest
import asyncio
from unittest.mock import MagicMock
from starlette.testclient import TestClient
from result_processor import (
    Server,
    insert_dns,
    insert_https,
    insert_ssl,
    process_https,
    process_dns,
    process_ssl,
)
from test_data import *


def test_process_https():
    test_https_insert = MagicMock(return_value=asyncio.Future())
    test_https_insert.return_value.set_result("HTTPS Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": test_https_insert,
                "ssl": insert_ssl,
                "dns": insert_dns,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dns": process_dns,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": https_result_data, "scan_id": 1, "scan_type": "https"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: HTTPS Scan inserted into database"
    )


def test_process_ssl():
    test_ssl_insert = MagicMock(return_value=asyncio.Future())
    test_ssl_insert.return_value.set_result("SSL Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": test_ssl_insert,
                "dns": insert_dns,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dns": process_dns,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": ssl_result_data, "scan_id": 1, "scan_type": "ssl"}

    res = test_client.post("/process", json=test_payload)

    assert res.text == "Results processed successfully: SSL Scan inserted into database"


def test_process_dns():
    test_dns_insert = MagicMock(return_value=asyncio.Future())
    test_dns_insert.return_value.set_result("DNS Scans inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": insert_ssl,
                "dns": test_dns_insert,
            },
            "process": {
                "https": process_https,
                "ssl": process_ssl,
                "dns": process_dns,
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": dns_result_data, "scan_id": 1, "scan_type": "dns"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: DNS Scans inserted into database"
    )
