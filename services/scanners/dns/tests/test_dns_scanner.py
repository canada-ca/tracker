import pytest
from pretend import stub
from starlette.testclient import TestClient
from dns_scanner import Server


def test_scan():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(server_client=client_stub)

    test_client = TestClient(test_app)

    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "selectors": ["selector1", "selector2"],
    }

    res = test_client.post("/", json=test_payload)

    assert "(ID=1) DNS scan completed" in res.text
