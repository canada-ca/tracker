import pytest
from pretend import stub
from starlette.testclient import TestClient
from dns_scanner import Server


def test_scan():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(default_client=client_stub)

    test_client = TestClient(test_app)

    test_payload = {"scan_id": 1, "domain": "cyber.gc.ca", "selectors": ["selector1._domainkey", "selector2._domainkey"]}

    res = test_client.post("/scan", json=test_payload)

    assert (
        res.text == "DNS scan completed. Scan results dispatched to result-processor"
    )
