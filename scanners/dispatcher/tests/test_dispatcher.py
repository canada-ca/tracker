import pytest
import asyncio
from unittest.mock import MagicMock
from starlette.testclient import TestClient
from dispatcher import Server
from utils import *


def test_web_scan():
    test_https = MagicMock(return_value=asyncio.Future())
    test_https.return_value.set_result("Dispatched to https scanner")
    test_ssl = MagicMock(return_value=asyncio.Future())
    test_ssl.return_value.set_result("Dispatched to ssl scanner")

    test_app = Server(
        scanners={
            "dns": {"auto": scan_dns, "manual": manual_scan_dns},
            "https": {"auto": test_https, "manual": manual_scan_https},
            "ssl": {"auto": test_ssl, "manual": manual_scan_ssl},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "user_init": False,
        "selectors": [],
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "web",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_mail_scan():
    test_dns = MagicMock(return_value=asyncio.Future())
    test_dns.return_value.set_result("Dispatched to dns scanner")

    test_app = Server(
        scanners={
            "dns": {"auto": test_dns, "manual": manual_scan_dns},
            "https": {"auto": scan_https, "manual": manual_scan_https},
            "ssl": {"auto": scan_ssl, "manual": manual_scan_ssl},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "user_init": False,
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "mail",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_manual_web_scan():
    test_https = MagicMock(return_value=asyncio.Future())
    test_https.return_value.set_result("Dispatched to https scanner")
    test_ssl = MagicMock(return_value=asyncio.Future())
    test_ssl.return_value.set_result("Dispatched to ssl scanner")

    test_app = Server(
        scanners={
            "dns": {"auto": scan_dns, "manual": manual_scan_dns},
            "https": {"auto": scan_https, "manual": test_https},
            "ssl": {"auto": scan_ssl, "manual": test_ssl},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "user_init": True,
        "selectors": [],
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "web",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_manual_mail_scan():
    test_dns = MagicMock(return_value=asyncio.Future())
    test_dns.return_value.set_result("Dispatched to dns scanner")

    test_app = Server(
        scanners={
            "dns": {"auto": scan_dns, "manual": test_dns},
            "https": {"auto": scan_https, "manual": manual_scan_https},
            "ssl": {"auto": scan_ssl, "manual": manual_scan_ssl},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "user_init": True,
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "mail",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"
