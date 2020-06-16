async def scan_dns(payload, client):
    try:
        client.post(
            url="http://dns-scanner.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to dns scanner"


async def scan_https(payload, client):
    try:
        client.post(
            url="http://https-scanner.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to https scanner"


async def scan_ssl(payload, client):
    try:
        client.post(
            url="http://ssl-scanner.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to ssl scanner"


async def manual_scan_dns(payload, client):
    try:
        client.post(
            url="http://dns-scanner-manual.tracker.svc.cluster.local/scan",
            json=payload,
        )
    except Exception as e:
        return str(e)
    return "Dispatched to dns scanner"


async def manual_scan_https(payload, client):
    try:
        client.post(
            url="http://https-scanner-manual.tracker.svc.cluster.local/scan",
            json=payload,
        )
    except Exception as e:
        return str(e)
    return "Dispatched to https scanner"


async def manual_scan_ssl(payload, client):
    try:
        client.post(
            url="http://ssl-scanner-manual.tracker.svc.cluster.local/scan", json=payload
        )
    except Exception as e:
        return str(e)
    return "Dispatched to ssl scanner"
