import dns.name
import dns.rdatatype
import dns.resolver
import pytest
from dns.exception import Timeout
from dns.resolver import NXDOMAIN, NoAnswer, NoNameservers

from dns_scanner import cname_target


class FakeCNAMERdata:
    def __init__(self, target):
        self.target = dns.name.from_text(target)


class FakeChainResolver:
    """Resolves CNAMEs from a dict; A lookups raise the configured exception (or succeed)."""

    def __init__(self, cnames=None, a_error=None):
        self.cnames = cnames or {}
        self.a_error = a_error

    def resolve(self, qname, rdtype):
        if rdtype == dns.rdatatype.CNAME:
            if qname not in self.cnames:
                raise NoAnswer
            return [FakeCNAMERdata(self.cnames[qname])]
        if self.a_error is not None:
            raise self.a_error
        return ["192.0.2.1"]


@pytest.mark.parametrize(
    "a_error, expected",
    [
        (None, "NOERROR"),
        (NoAnswer(), "NOERROR"),
        (NXDOMAIN(), "NXDOMAIN"),
        (NoNameservers(), "SERVFAIL"),
        (Timeout(), "TIMEOUT"),
        (dns.resolver.LifetimeTimeout(timeout=1.0, errors={}), "TIMEOUT"),
        (RuntimeError("boom"), None),
    ],
)
def test_get_cname_target_rcode(a_error, expected):
    resolver = FakeChainResolver(a_error=a_error)
    assert cname_target.get_cname_target_rcode("www.example.com", "target.example.net", resolver) == expected


def test_find_final_cname_target_follows_chain():
    resolver = FakeChainResolver(cnames={"a.example.net": "b.example.net", "b.example.net": "c.example.net"})
    assert cname_target.find_final_cname_target("a.example.net", resolver) == "c.example.net"


def test_find_final_cname_target_stops_on_loop():
    resolver = FakeChainResolver(cnames={"a.example.net": "b.example.net", "b.example.net": "a.example.net"})
    assert cname_target.find_final_cname_target("a.example.net", resolver) == "b.example.net"


def test_find_final_cname_target_respects_hop_limit():
    cnames = {f"h{i}.example.net": f"h{i + 1}.example.net" for i in range(20)}
    resolver = FakeChainResolver(cnames=cnames)
    assert cname_target.find_final_cname_target("h0.example.net", resolver, max_hops=3) == "h3.example.net"
