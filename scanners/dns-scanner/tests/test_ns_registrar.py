import dns

from dns_scanner import ns_registrar


class FakeHost:
    def __init__(self, value):
        self.value = value

    def to_text(self):
        return self.value


class FakeResponse:
    def __init__(self, rcode, authoritative):
        self._rcode = rcode
        self.flags = dns.flags.AA if authoritative else 0

    def rcode(self):
        return self._rcode


class RecordingResolver:
    def __init__(self):
        self.calls = []

    def resolve(self, name, query_type):
        self.calls.append((name, query_type))
        if query_type == dns.rdatatype.NS:
            return [FakeHost("ns1.example.com.")]
        raise AssertionError(f"Unexpected resolve call: {(name, query_type)}")


def test_check_ns_delegations_fallback_queries_zone_apex(monkeypatch):
    resolver = RecordingResolver()

    monkeypatch.setattr(ns_registrar, "get_ns_ip", lambda host, resolver: "192.0.2.1")
    def fake_probe(where, qname, qtype, recursion_desired, timeout):
        assert qname == "example.com"
        assert qtype == "SOA"
        return FakeResponse(dns.rcode.NOERROR, True)

    monkeypatch.setattr(ns_registrar, "probe_nameserver", fake_probe)

    result = ns_registrar.check_ns_delegations(
        domain="mail.example.com",
        zone_apex="example.com",
        ns_records={"hostnames": [], "errors": []},
        resolver=resolver,
    )

    assert resolver.calls[0] == ("example.com", dns.rdatatype.NS)
    assert result["ns_delegation"]["lame_type"] == "none"
    assert result["ns_delegation"]["authoritative_ok"] == 1


def test_build_registrar_context_defaults():
    context = ns_registrar.build_registrar_context("example.com")

    assert context["base_domain"] == "example.com"
    assert context["lookup_success"] is False
    assert context["error"] is None
    assert context["rdap_nameservers"] == []


def test_get_registrar_context_uses_rdap_timeout(monkeypatch):
    captured = {}

    class FakeRdapResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"nameservers": [], "entities": []}

    def fake_get(url, timeout):
        captured["url"] = url
        captured["timeout"] = timeout
        return FakeRdapResponse()

    monkeypatch.setattr(ns_registrar, "RDAP_TIMEOUT_SEC", 2.5)
    monkeypatch.setattr(ns_registrar.requests, "get", fake_get)

    context = ns_registrar.get_registrar_context("example.com", ns_hosts=[])

    assert captured["url"] == "https://rdap.org/domain/example.com"
    assert captured["timeout"] == 2.5
    assert context["lookup_success"] is True
