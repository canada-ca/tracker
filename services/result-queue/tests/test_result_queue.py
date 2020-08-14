import pytest
from pretend import stub
from result_queue import Server, dispatch_dns, dispatch_https, dispatch_ssl

test_queues = {
    "https": stub(enqueue=lambda func, payload, retry, job_timeout, result_ttl: None),
    "ssl": stub(enqueue=lambda func, payload, retry, job_timeout, result_ttl: None),
    "dns": stub(enqueue=lambda func, payload, retry, job_timeout, result_ttl: None),
}


@pytest.fixture
def app():
    client = Server("test", queues=test_queues)
    return client


@pytest.fixture
def client(app):
    with app.test_client() as cli:
        yield cli


def test_enqueue_dns(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }

    res = client.post("/dns", json=test_payload)

    assert res.data.decode("utf-8") == "DNS result processing request enqueued."


def test_enqueue_https(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post("/https", json=test_payload)

    assert res.data.decode("utf-8") == "HTTPS result processing request enqueued."


def test_enqueue_ssl(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post("/ssl", json=test_payload)

    assert res.data.decode("utf-8") == "SSL result processing request enqueued."
