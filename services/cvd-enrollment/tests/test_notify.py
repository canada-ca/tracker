import notify


def test_send_failure_is_logged_and_returns_none(monkeypatch, caplog):
    monkeypatch.delenv("NOTIFICATION_API_KEY", raising=False)
    notify._client.cache_clear()
    assert notify.send_enrollment_notification("a@b.ca", ["x.ca"]) is None
    assert "Failed to send email notification to a@b.ca" in caplog.text
