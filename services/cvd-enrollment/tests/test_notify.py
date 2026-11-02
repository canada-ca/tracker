import pytest

from notify import NotifySettings, send_enrollment_notification
from tests.conftest import NOTIFY_EMAIL_PATH, NOTIFY_TEMPLATE_ID


def test_sends_email_with_template_and_domain_personalisation(notify_server):
    res = send_enrollment_notification(notify_server.settings, "a@b.ca", ["x.ca", "y.ca"])
    assert res == {"id": "notification-1"}
    assert notify_server.sent_emails() == [
        {
            "email_address": "a@b.ca",
            "template_id": NOTIFY_TEMPLATE_ID,
            "personalisation": {"domains": "x.ca, y.ca", "count": 2},
        }
    ]
    assert notify_server.received[0].path == NOTIFY_EMAIL_PATH


def test_server_error_is_logged_and_returns_none(notify_server, caplog):
    notify_server.respond("POST", NOTIFY_EMAIL_PATH, 500, {"errors": [{"message": "boom"}]})
    assert send_enrollment_notification(notify_server.settings, "a@b.ca", ["x.ca"]) is None
    assert "Failed to send email notification to a@b.ca" in caplog.text


def test_missing_api_key_is_logged_and_returns_none(notify_server, caplog):
    settings = NotifySettings(api_key=None, base_url=notify_server.url, template_id="t")
    assert send_enrollment_notification(settings, "a@b.ca", ["x.ca"]) is None
    assert "Failed to send email notification to a@b.ca" in caplog.text
    assert notify_server.received == []
