import pytest
from pretend import stub
from starlette.testclient import TestClient
from ssl_scanner import Server


def test_scan():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(server_client=client_stub)

    test_client = TestClient(test_app)

    test_payload = {"uuid": 1, "domain": "cyber.gc.ca", "domain_key": "domains/1"}

    res = test_client.post("/", json=test_payload)

    assert "SSL scan completed" in res.text
