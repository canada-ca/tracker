def scan_dkim(payload, client):
    try:
        client.post(url="http://dkim-scanner.tracker.svc.cluster.local/scan", json=payload)
    except Exception as e:
        return str(e)
    return "Dispatched to dkim scanner"


def scan_dmarc(payload, client):
    try:
        client.post(url="http://dmarc-scanner.tracker.svc.cluster.local/scan", json=payload)
    except Exception as e:
        return str(e)
    return "Dispatched to dmarc scanner"


def scan_https(payload, client):
    try:
        client.post(url="http://https-scanner.tracker.svc.cluster.local/scan", json=payload)
    except Exception as e:
        return str(e)
    return "Dispatched to https scanner"


def scan_ssl(payload, client):
    try:
        client.post(url="http://ssl-scanner.tracker.svc.cluster.local/scan", json=payload)
    except Exception as e:
        return str(e)
    return "Dispatched to ssl scanner"


def manual_scan_dkim(payload, client):
    try:
        client.post(
            url="http://dkim-scanner-manual.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to dkim scanner"


def manual_scan_dmarc(payload, client):
    try:
        client.post(
            url="http://dmarc-scanner-manual.tracker.svc.cluster.local/scan", json=payload,
        )
    except Exception as e:
        return str(e)
    return "Dispatched to dmarc scanner"


def manual_scan_https(payload, client):
    try:
        client.post(
            url="http://https-scanner-manual.tracker.svc.cluster.local/scan", json=payload,
        )
    except Exception as e:
        return str(e)
    return "Dispatched to https scanner"


def manual_scan_ssl(payload, client):
    try:
        client.post(
            url="http://ssl-scanner-manual.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to ssl scanner"
