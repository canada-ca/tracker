import pytest
from pretend import stub
from starlette.testclient import TestClient
from starlette.responses import PlainTextResponse
from dispatcher import Server
from utils import *


def test_web_scan():
    test_dkim = stub(
        stub_function=lambda payload, client: PlainTextResponse("Dispatched to dkim scanner")
    )
    test_dmarc = stub(
        stub_function=lambda payload, client: PlainTextResponse(
            "Dispatched to dmarc scanner"
        )
    )
    test_https = stub(
        stub_function=lambda payload, client: PlainTextResponse(
            "Dispatched to https scanner"
        )
    )
    test_ssl = stub(
        stub_function=lambda payload, client: PlainTextResponse("Dispatched to ssl scanner")
    )

    test_app = Server(
        scanners={
            "dkim": Scanner(test_dkim.stub_function),
            "dmarc": Scanner(test_dmarc.stub_function),
            "https": Scanner(test_https.stub_function),
            "ssl": Scanner(test_ssl.stub_function),
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {"scan_id": 1, "domain": "cyber.gc.ca", "user_init": False}
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "web",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "All scans successfully dispatched to designated scanners"


def test_mail_scan():
    test_dkim = stub(
        stub_function=lambda payload, client: PlainTextResponse("Dispatched to dkim scanner")
    )
    test_dmarc = stub(
        stub_function=lambda payload, client: PlainTextResponse(
            "Dispatched to dmarc scanner"
        )
    )
    test_https = stub(
        stub_function=lambda payload, client: PlainTextResponse(
            "Dispatched to https scanner"
        )
    )
    test_ssl = stub(
        stub_function=lambda payload, client: PlainTextResponse("Dispatched to ssl scanner")
    )

    test_app = Server(
        scanners={
            "dkim": Scanner(test_dkim.stub_function),
            "dmarc": Scanner(test_dmarc.stub_function),
            "https": Scanner(test_https.stub_function),
            "ssl": Scanner(test_ssl.stub_function),
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "selector1._domainkey.cyber.gc.ca",
        "user_init": False,
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "mail",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "All scans successfully dispatched to designated scanners"


def test_https_dispatch():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        default_client=client_stub
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/https", json=payload)

    assert res.text == "Dispatched to https scanner"


def test_ssl_dispatch():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        default_client=client_stub
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/ssl", json=payload)

    assert res.text == "Dispatched to ssl scanner"


def test_dmarc_dispatch():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        default_client=client_stub
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/dmarc", json=payload)

    assert res.text == "Dispatched to dmarc scanner"


def test_dkim_dispatch():
    client_stub = stub(post=lambda url, json: None)

    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        default_client=client_stub
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "selector1._domainkey.cyber.gc.ca"}

    res = test_client.post("/dkim", json=payload)

    assert res.text == "Dispatched to dkim scanner"
