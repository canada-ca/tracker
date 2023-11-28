from easm_client import client


UNNECESSARY_OPEN_PORTS = {
    "FTP": [20, 21],
    "SSH": [22],
    "Telnet": [23],
    "SMTP": [25, 587],
    "DNS": [53],
    "NetBIOS": [137, 139],
    "SMB": [445],
    "Ports": [1433, 1434, 3306, 465, 55443],
    "Remote desktop": [3389],
    "MQTT": [1883, 8883],
    "AMQP": [5672, 5671],
}

UNNECESSARY_EXPOSED_HEADERS = [
    "x-aspnet-version",
    "server",
    "x-powered-by",
]


def get_all_asset_cves(asset):
    web_components = asset["asset"]["webComponents"]
    detected_cves = {
        "LOW": [],
        "MEDIUM": [],
        "HIGH": [],
        "CRITICAL": [],
    }
    for web_component in web_components:
        for cve in web_component["cve"]:
            severity = cve["cvss3Summary"]["baseSeverity"]
            detected_cves[severity].append(cve["name"])

    for k, v in detected_cves.items():
        v = list(set(v))
        v.sort(reverse=True)
        print(f"{k}: {v}")

    return detected_cves


def get_web_components(asset):
    for wc in asset["asset"]["webComponents"]:
        print(wc["type"] + ":", wc["name"])
    return asset["asset"]["webComponents"]


def get_cookies(asset):
    return asset["asset"]["cookies"]


def get_asset(asset_id):
    return client.assets.get(asset_id=asset_id)


def get_vulnerable_web_components(asset):
    vulnerable_web_components = []
    web_components = get_web_components(asset)
    for wc in web_components:
        if len(wc["cve"]) > 0:
            print(wc["type"] + ":", wc["name"])
            vulnerable_web_components.append(wc)
    return vulnerable_web_components


def get_all_unique_cves(vuln_components):
    all_cves = []
    for wc in vuln_components:
        for cve in wc["cve"]:
            all_cves.append(cve["name"])
    return list(set(all_cves))


def get_open_ports(asset):
    services = asset["asset"]["services"]
    open_ports = []
    for service in services:
        open_ports.append(service["port"])
    return open_ports


def get_unnecessary_exposed_headers(asset):
    headers = asset["asset"]["headers"]
    exposed_headers = []
    for header in headers:
        if header["headerName"] == "x-frame-options" and header["headerValue"] not in [
            "sameorigin",
            "deny",
        ]:
            print(header["headerName"] + ":", header["headerValue"])
            exposed_headers.append(header["headerName"])
        elif header["headerName"] in UNNECESSARY_EXPOSED_HEADERS:
            print(header["headerName"])
            exposed_headers.append(header["headerName"])
    return exposed_headers


def get_unnecessary_open_ports(asset):
    open_ports = get_open_ports(asset)
    unnecessary_open_ports = []
    for port in open_ports:
        for service, ports in UNNECESSARY_OPEN_PORTS.items():
            if port in ports:
                print(service + ":", port)
                unnecessary_open_ports.append(port)
    return {
        "open_ports": open_ports,
        "unnecessary_open_ports": unnecessary_open_ports,
    }


def get_whois(asset):
    return asset["asset"]["domainAsset"]


def get_web_component_types(asset):
    web_components = get_web_components(asset)
    types = []
    for wc in web_components:
        types.append(wc["type"])
    return list(set(types))


def three_one_two(asset):
    types = get_web_component_types(asset)
    if "DDOS Protection" in types:
        return True
    return False


def three_one_three(asset):
    types = get_web_component_types(asset)
    if "CDN" in types:
        return True
    return False
