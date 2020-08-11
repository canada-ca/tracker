import pytest
import dill
from pretend import stub
from result_queue import Server, dispatch_dns, dispatch_https, dispatch_ssl

requests_stub = stub(post=lambda url, json, headers: None)
test_queues = {"https": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None),
               "ssl": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None),
               "dns": stub(enqueue=lambda func, payload, cli, retry, job_timeout, result_ttl: None)}

client = Server("test", server_client=requests_stub, queues=test_queues)


def test_enqueue_dns():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }

    res = client.post('/dns', json=test_payload)

    assert res.text == "DNS result processing request enqueued."


def test_enqueue_https():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post('/https', json=test_payload)

    assert res.text == "HTTPS result processing request enqueued."


def test_enqueue_ssl():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = client.post('/ssl', json=test_payload)

    assert res.text == "SSL result processing request enqueued."


def test_dispatch_dns():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
        "selectors": ["selector1._domainkey", "selector2._domainkey"],
    }

    res = dispatch_dns(test_payload, dill.dumps(requests_stub))

    assert res == "Dispatched DNS result processing request."


def test_dispatch_https():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = dispatch_https(test_payload, dill.dumps(requests_stub))

    assert res == "Dispatched HTTPS result processing request."


def test_dispatch_ssl():
    test_payload = {
        "scan_id": 1,
        "domain": "cyber.gc.ca",
    }

    res = dispatch_ssl(test_payload, dill.dumps(requests_stub))

    assert res == "Dispatched SSL result processing request."
