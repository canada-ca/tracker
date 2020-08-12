import pytest
from pretend import stub
from scan_queue import Server, dispatch_dns, dispatch_https, dispatch_ssl

test_queues = {"https": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None),
               "ssl": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None),
               "dns": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None)}

@pytest.fixture
def client():
    client = Server("test", queues=test_queues)


def test_enqueue_dns(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }

    res = client.post('/dns', json=test_payload)

    assert res.text == "DNS scan request enqueued."


def test_enqueue_https(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post('/https', json=test_payload)

    assert res.text == "HTTPS scan request enqueued."


def test_enqueue_ssl(client):
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post('/ssl', json=test_payload)

    assert res.text == "SSL scan request enqueued."
