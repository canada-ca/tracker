import pytest
from pretend import stub
from starlette.testclient import TestClient
from starlette.responses import PlainTextResponse
from ..result_processor import Server, insert_results, insert_dkim, insert_dmarc, insert_https, insert_ssl, Insertor, process_results, Processor


def test_insert_https():
    test_https = stub(insert=lambda results, scan_type, scan_id, database: PlainTextResponse("Scan results sent to result-processor"))

    test_app = Server(functions={
        "dispatch": dispatch_stub,
        "scan": Scan(scan_https),
    })

    test_client = TestClient(test_app)

    test_payload = {"scan_id": 1, "domain": "cyber.gc.ca"}

    res = test_client.post("/receive", payload=test_payload)

    assert res.text == "HTTPS scan completed. Scan results sent to result-processor"


def test_process():
    test_app = Server(functions={
        "dispatch": Dispatcher(dispatch_results),
        "scan": Scan(scan_https),
        },
        client=stub(post=lambda url, json: None)
    )

    test_client = TestClient(test_app)

    test_payload = {"results": 1}

    res = test_client.post("/dispatch", payload=test_payload)

    assert res.text == "Scan results sent to result-processor"
