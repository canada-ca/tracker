import pytest
from pretend import stub
from starlette.testclient import TestClient
from starlette.responses import PlainTextResponse
from result_processor import (
    Server,
    insert_dkim,
    insert_dmarc,
    insert_https,
    insert_ssl,
    Insertor,
    process_https,
    process_dkim,
    process_dmarc,
    process_ssl,
    Processor,
)
from test_data import *


def test_insert_https():
    test_https = stub(
        insert=lambda results, scan_id, database: PlainTextResponse(
            "HTTPS Scan inserted into database"
        )
    )

    test_app = Server(
        functions={
            "insert": {
                "https": test_https,
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "https"}

    res = test_client.post("/insert", payload=test_payload)

    assert (
        res.text == "Database insertion(s) completed: HTTPS Scan inserted into database"
    )


def test_insert_ssl():
    test_ssl = stub(
        insert=lambda results, scan_id, database: PlainTextResponse(
            "SSL Scan inserted into database"
        )
    )

    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": test_ssl,
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "ssl"}

    res = test_client.post("/insert", payload=test_payload)

    assert (
        res.text == "Database insertion(s) completed: SSL Scan inserted into database"
    )


def test_insert_dmarc():
    test_dmarc = stub(
        insert=lambda results, scan_id, database: PlainTextResponse(
            "DMARC Scan inserted into database"
        )
    )

    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": test_dmarc,
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "dmarc"}

    res = test_client.post("/insert", payload=test_payload)

    assert (
        res.text == "Database insertion(s) completed: DMARC Scan inserted into database"
    )


def test_insert_dkim():
    test_dkim = stub(
        insert=lambda results, scan_id, database: PlainTextResponse(
            "DKIM Scan inserted into database"
        )
    )

    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": test_dkim,
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": {"results": 1}, "scan_id": 1, "scan_type": "dkim"}

    res = test_client.post("/insert", payload=test_payload)

    assert (
        res.text == "Database insertion(s) completed: DKIM Scan inserted into database"
    )


def test_process_https():
    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": https_result_data, "scan_type": "https"}

    res = test_client.post("/process", payload=test_payload)
    res_dict = res.json()

    assert res_dict["error"] is None


def test_process_ssl():
    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": ssl_result_data, "scan_type": "ssl"}

    res = test_client.post("/process", payload=test_payload)
    res_dict = res.json()

    assert res_dict["error"] is None


def test_process_dmarc():
    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": dmarc_result_data, "scan_type": "dmarc"}

    res = test_client.post("/process", payload=test_payload)
    res_dict = res.json()

    assert res_dict["error"] is None


def test_process_dkim():
    test_app = Server(
        functions={
            "insert": {
                "https": Insertor(insert_https),
                "ssl": Insertor(insert_ssl),
                "dmarc": Insertor(insert_dmarc),
                "dkim": Insertor(insert_dkim),
            },
            "process": {
                "https": Processor(process_https),
                "ssl": Processor(process_ssl),
                "dmarc": Processor(process_dmarc),
                "dkim": Processor(process_dkim),
            },
        }
    )

    test_client = TestClient(test_app)

    test_payload = {"results": dkim_result_data, "scan_type": "dkim"}

    res = test_client.post("/process", payload=test_payload)
    res_dict = res.json()

    assert res_dict["error"] is None
