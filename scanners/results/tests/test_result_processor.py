import pytest
import asyncio
from unittest.mock import MagicMock
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


def test_process_https():
    test_https_insert = MagicMock(return_value=asyncio.Future())
    test_https_insert.return_value.set_return_value("HTTPS Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": test_https_insert,
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

    test_payload = {"results": https_result_data, "scan_id": 1, "scan_type": "https"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: HTTPS Scan inserted into database"
    )


def test_process_ssl():
    test_ssl_insert = MagicMock(return_value=asyncio.Future())
    test_ssl_insert.return_value.set_return_value("SSL Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": test_ssl_insert,
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

    test_payload = {"results": ssl_result_data, "scan_id": 1, "scan_type": "ssl"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: SSL Scan inserted into database"
    )


def test_process_dmarc():
    test_dmarc_insert = MagicMock(return_value=asyncio.Future())
    test_dmarc_insert.return_value.set_return_value("DMARC Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": insert_ssl,
                "dmarc": test_dmarc_insert,
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

    test_payload = {"results": dmarc_result_data, "scan_id": 1, "scan_type": "dmarc"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: DMARC Scan inserted into database"
    )


def test_process_dkim():
    test_dkim_insert = MagicMock(return_value=asyncio.Future())
    test_dkim_insert.return_value.set_return_value("DKIM Scan inserted into database")
    test_app = Server(
        functions={
            "insert": {
                "https": insert_https,
                "ssl": insert_ssl,
                "dmarc": insert_dmarc,
                "dkim": test_dkim_insert,
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

    test_payload = {"results": dkim_result_data, "scan_id": 1, "scan_type": "dkim"}

    res = test_client.post("/process", json=test_payload)

    assert (
        res.text == "Results processed successfully: DKIM Scan inserted into database"
    )

