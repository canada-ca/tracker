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
            "ns": {"hostnames": [], "errors": []},
        }


class FakeDKIMScanner:
    def __init__(self, domain, selectors):
        self.domain = domain
        self.selectors = selectors

    def run(self):
        return {}


def test_scan_domain_skips_rdap_lookup_when_disabled(monkeypatch):
    monkeypatch.setattr(scanner_mod, "ENABLE_RDAP_LOOKUP", False)
    monkeypatch.setattr(scanner_mod, "get_dns_return_type", lambda domain, query_type: "NOERROR")
    monkeypatch.setattr(scanner_mod, "find_zone_apex", lambda domain: "example.com")
    monkeypatch.setattr(
        scanner_mod,
        "check_ns_delegations",
        lambda domain, zone_apex, ns_records: {"ns_hosts": [], "ns_checks": [], "ns_delegation": {}},
    )
    monkeypatch.setattr(
        scanner_mod,
        "get_registrar_context",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("should not be called")),
    )
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

    result = scanner_mod.scan_domain("mail.example.com", dkim_selectors=[])

    assert result["record_exists"] is True
    assert result["registrar_context"]["base_domain"] == "example.com"
    assert result["registrar_context"]["lookup_success"] is False
    assert result["registrar_context"]["error"] == "rdap_lookup_disabled"
