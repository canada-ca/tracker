from dns_scanner import dns_scanner as scanner_mod


class FakeResolver:
    timeout = None
    lifetime = None

    def resolve(self, *args, **kwargs):
        raise scanner_mod.NoAnswer


class FakeDMARCScanner:
    def __init__(self, domain):
        self.domain = domain

    def run(self):
        return {
            "base_domain": "example.com",
            "mx": {"hosts": [], "warnings": []},
            "spf": {},
            "dmarc": {},
            "ns": {"hostnames": ["ns1.example.com."], "errors": []},
        }


class FakeDKIMScanner:
    def __init__(self, domain, selectors):
        self.domain = domain
        self.selectors = selectors

    def run(self):
        return {"selectors": self.selectors}


def test_scan_domain_returns_expected_shape(monkeypatch):
    monkeypatch.setattr(scanner_mod, "ENABLE_RDAP_LOOKUP", False)
    monkeypatch.setattr(
        scanner_mod,
        "get_dns_return_type",
        lambda domain, query_type: "NOERROR",
    )
    monkeypatch.setattr(scanner_mod, "find_zone_apex", lambda domain: "example.com")
    monkeypatch.setattr(scanner_mod, "DMARCScanner", FakeDMARCScanner)
    monkeypatch.setattr(scanner_mod, "DKIMScanner", FakeDKIMScanner)
    monkeypatch.setattr(scanner_mod.dns.resolver, "Resolver", lambda: FakeResolver())
    monkeypatch.setattr(
        scanner_mod,
        "get_wildcard_status",
        lambda domain, resolver, a_records: {
            "wildcard_entry": False,
            "wildcard_sibling": False,
        },
    )
    monkeypatch.setattr(
        scanner_mod,
        "check_ns_delegations",
        lambda domain, zone_apex, ns_records: {
            "ns_hosts": ns_records.get("hostnames", []),
            "ns_checks": [],
            "ns_delegation": {"lame_type": "none"},
        },
    )

    result = scanner_mod.scan_domain("mail.example.com", dkim_selectors=["selector1"])

    assert result["record_exists"] is True
    assert result["rcode"] == "NOERROR"
    assert result["zone_apex"] == "example.com"
    assert result["base_domain"] == "example.com"
    assert result["dkim"] == {"selectors": ["selector1"]}
    assert result["registrar_context"]["error"] == "rdap_lookup_disabled"
