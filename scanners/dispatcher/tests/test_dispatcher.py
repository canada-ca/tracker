import pytest
from pretend import stub
from starlette.testclient import TestClient
from starlette.responses import PlainTextResponse
from dispatcher import Server
from utils import *


def test_web_scan():
    test_dkim = stub(
        dispatch=lambda payload, client: PlainTextResponse("Dispatched to DKIM scanner")
    )
    test_dmarc = stub(
        dispatch=lambda payload, client: PlainTextResponse(
            "Dispatched to DMARC scanner"
        )
    )
    test_https = stub(
        dispatch=lambda payload, client: PlainTextResponse(
            "Dispatched to HTTPS scanner"
        )
    )
    test_ssl = stub(
        dispatch=lambda payload, client: PlainTextResponse("Dispatched to SSL scanner")
    )

    test_app = Server(
        scanners={
            "dkim": test_dkim,
            "dmarc": test_dmarc,
            "https": test_https,
            "ssl": test_ssl,
        }
    )

    test_client = TestClient(test_app)

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
        dispatch=lambda payload, client: PlainTextResponse("Dispatched to DKIM scanner")
    )
    test_dmarc = stub(
        dispatch=lambda payload, client: PlainTextResponse(
            "Dispatched to DMARC scanner"
        )
    )
    test_https = stub(
        dispatch=lambda payload, client: PlainTextResponse(
            "Dispatched to HTTPS scanner"
        )
    )
    test_ssl = stub(
        dispatch=lambda payload, client: PlainTextResponse("Dispatched to SSL scanner")
    )

    test_app = Server(
        scanners={
            "dkim": test_dkim,
            "dmarc": test_dmarc,
            "https": test_https,
            "ssl": test_ssl,
        }
    )

    test_client = TestClient(test_app)

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
    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        client=stub(post=lambda url, json: None),
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/https", json=payload)

    assert res.text == "Dispatched to HTTPS scanner"


def test_ssl_dispatch():
    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        client=stub(post=lambda url, json: None),
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/ssl", json=payload)

    assert res.text == "Dispatched to SSL scanner"


def test_dmarc_dispatch():
    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        client=stub(post=lambda url, json: None),
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/dmarc", json=payload)

    assert res.text == "Dispatched to DMARC scanner"


def test_dkim_dispatch():
    test_app = Server(
        scanners={
            "dkim": Scanner(scan_type=scan_dkim),
            "dmarc": Scanner(scan_type=scan_dmarc),
            "https": Scanner(scan_type=scan_https),
            "ssl": Scanner(scan_type=scan_ssl),
        },
        client=stub(post=lambda url, json: None),
    )

    test_client = TestClient(test_app)

    payload = {"scan_id": 1, "domain": "selector1._domainkey.cyber.gc.ca"}

    res = test_client.post("/https", json=payload)

    assert res.text == "Dispatched to DKIM scanner"
