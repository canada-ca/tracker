def scan_dkim(payload, client):
    client.post(
        url="http://dkim-scanner.tracker.svc.cluster.local/receive", json=payload
    )


def scan_dmarc(payload, client):
    client.post(
        url="http://dmarc-scanner.tracker.svc.cluster.local/receive", json=payload
    )


def scan_https(payload, client):
    client.post(
        url="http://https-scanner.tracker.svc.cluster.local/receive", json=payload
    )


def scan_ssl(payload, client):
    client.post(
        url="http://ssl-scanner.tracker.svc.cluster.local/receive", json=payload
    )


def manual_scan_dkim(payload, client):
    client.post(
        url="http://dkim-scanner-manual.tracker.svc.cluster.local/receive", json=payload
    )


def manual_scan_dmarc(payload, client):
    client.post(
        url="http://dmarc-scanner-manual.tracker.svc.cluster.local/receive",
        json=payload,
    )


def manual_scan_https(payload, client):
    client.post(
        url="http://https-scanner-manual.tracker.svc.cluster.local/receive",
        json=payload,
    )


def manual_scan_ssl(payload, client):
    client.post(
        url="http://ssl-scanner-manual.tracker.svc.cluster.local/receive", json=payload
    )
