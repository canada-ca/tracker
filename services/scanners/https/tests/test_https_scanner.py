import pytest
from pretend import stub
from starlette.testclient import TestClient
from https_scanner import Server


def test_scan():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(server_client=client_stub)

    test_client = TestClient(test_app)

    test_payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/", json=test_payload)

    assert "(ID=1) HTTPS scan completed" in res.text
