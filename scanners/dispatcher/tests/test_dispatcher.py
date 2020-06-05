import pytest
import asyncio
from unittest.mock import MagicMock
from pretend import stub
from starlette.testclient import TestClient
from dispatcher import Server
from utils import *


def test_web_scan():
    test_dmarc = MagicMock(return_value=asyncio.Future())
    test_dmarc.return_value.set_result("Dispatched to dmarc scanner")
    test_https = MagicMock(return_value=asyncio.Future())
    test_https.return_value.set_result("Dispatched to https scanner")
    test_ssl = MagicMock(return_value=asyncio.Future())
    test_ssl.return_value.set_result("Dispatched to ssl scanner")

    test_app = Server(
        scanners={
            "dkim": {"auto": scan_dkim, "manual": manual_scan_dkim},
            "dmarc": {"auto": test_dmarc.test, "manual": manual_scan_dmarc},
            "https": {"auto": test_https.test, "manual": manual_scan_https},
            "ssl": {"auto": test_ssl.test, "manual": manual_scan_ssl},
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

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_mail_scan():
    test_dmarc = MagicMock(return_value=asyncio.Future())
    test_dmarc.return_value.set_result("Dispatched to dmarc scanner")
    test_dkim = MagicMock(return_value=asyncio.Future())
    test_dkim.return_value.set_result("Dispatched to dkim scanner")

    test_app = Server(
        scanners={
            "dkim": {"auto": test_dkim.test, "manual": manual_scan_dkim},
            "dmarc": {"auto": test_dmarc.test, "manual": manual_scan_dmarc},
            "https": {"auto": scan_https, "manual": manual_scan_https},
            "ssl": {"auto": scan_ssl, "manual": manual_scan_ssl},
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

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_manual_web_scan():
    test_dmarc = MagicMock(return_value=asyncio.Future())
    test_dmarc.return_value.set_result("Dispatched to dmarc scanner")
    test_https = MagicMock(return_value=asyncio.Future())
    test_https.return_value.set_result("Dispatched to https scanner")
    test_ssl = MagicMock(return_value=asyncio.Future())
    test_ssl.return_value.set_result("Dispatched to ssl scanner")

    test_app = Server(
        scanners={
            "dkim": {"auto": scan_dkim, "manual": manual_scan_dkim},
            "dmarc": {"auto": scan_dmarc, "manual": test_dmarc.test},
            "https": {"auto": scan_https, "manual": test_https.test},
            "ssl": {"auto": scan_ssl, "manual": test_ssl.test},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {"scan_id": 1, "domain": "cyber.gc.ca", "user_init": True}
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "web",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"


def test_manual_mail_scan():
    test_dmarc = MagicMock(return_value=asyncio.Future())
    test_dmarc.return_value.set_result("Dispatched to dmarc scanner")
    test_dkim = MagicMock(return_value=asyncio.Future())
    test_dkim.return_value.set_result("Dispatched to dkim scanner")

    test_app=Server(
        scanners={
            "dkim": {"auto": scan_dkim, "manual": test_dkim.test},
            "dmarc": {"auto": scan_dmarc, "manual": test_dmarc.test},
            "https": {"auto": scan_https, "manual": manual_scan_https},
            "ssl": {"auto": scan_ssl, "manual": manual_scan_ssl},
        },
    )

    test_client = TestClient(test_app)
    test_app.state.client = test_client

    test_payload = {
        "scan_id": 1,
        "domain": "selector1._domainkey.cyber.gc.ca",
        "user_init": True,
    }
    headers = {
        "Content-Type": "application/json",
        "Data": str(test_payload),
        "Scan-Type": "mail",
    }

    res = test_client.post("/receive", headers=headers)

    assert res.text == "Scan successfully dispatched to designated scanners"
