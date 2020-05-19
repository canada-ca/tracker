from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask


def scan_dkim(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, url='http://dkim-scanner.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to DKIM scanner", background=task)


def scan_dmarc(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, url='http://dmarc-scanner.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to DMARC scanner", background=task)


def scan_https(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, url='http://https-scanner.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to HTTPS scanner", background=task)


def scan_ssl(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, url='http://ssl-scanner.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to SSL scanner", background=task)


def manual_scan_dkim(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, 'http://dkim-scanner-manual.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to DKIM scanner (User-initiated scan)", background=task)


def manual_scan_dmarc(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, 'http://dmarc-scanner-manual.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to DMARC scanner (User-initiated scan)", background=task)


def manual_scan_https(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, 'http://https-scanner-manual.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to HTTPS scanner (User-initiated scan)", background=task)


def manual_scan_ssl(payload, client):
    headers = {
        "Content-Type": "application/json"
    }
    task = BackgroundTask(client.post, 'http://ssl-scanner-manual.tracker.svc.cluster.local', data=payload, headers=headers)
    return PlainTextResponse("Domain dispatched to SSL scanner (User-initiated scan)", background=task)
