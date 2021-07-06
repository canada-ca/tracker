import pytest
from pretend import stub
from starlette.testclient import TestClient
from dns_scanner import Server


def test_scan():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(server_client=client_stub)

    test_client = TestClient(test_app)

    test_payload = {
        "user_key": 1,
        "domain": "cyber.gc.ca",
        "domain_key": "domains/1",
        "selectors": ["selector1", "selector2"],
        "shared_id": 1234
    }

    res = test_client.post("/", json=test_payload)

    assert "Scan completed" == res.text
