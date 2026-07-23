import os

import dns
import dns.resolver
import requests
from dns.exception import Timeout
from dns.resolver import NXDOMAIN, NoAnswer, NoNameservers

TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "20"))


def probe_nameserver(
    where: str, qname: str, qtype: str, recursion_desired: bool, timeout: int
):
    query = dns.message.make_query(
        qname,
        dns.rdatatype.from_text(qtype),
        use_edns=True,
    )
    if not recursion_desired:
        query.flags &= ~dns.flags.RD
    return dns.query.udp(query, where=where, timeout=timeout)


def get_ns_ip(host: str, resolver):
    ns_ip = None
    try:
        ns_a = resolver.resolve(host, "A")
        if ns_a:
            ns_ip = ns_a[0].to_text()
    except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
        ns_ip = None

    if ns_ip is None:
        try:
            ns_aaaa = resolver.resolve(host, "AAAA")
            if ns_aaaa:
                ns_ip = ns_aaaa[0].to_text()
        except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
            ns_ip = None

    return ns_ip


def check_ns_delegations(domain, zone_apex, ns_records, resolver=None, timeout_sec=10):
    if resolver is None:
        resolver = dns.resolver.get_default_resolver()

    qname = zone_apex
    if not zone_apex:
        qname = domain

    ns_hosts = ns_records.get("hostnames", [])
    if len(ns_hosts) == 0:
        try:
            ns_res = resolver.resolve(domain, dns.rdatatype.NS)
            ns_hosts = [host.to_text() for host in ns_res]
        except (NoAnswer, NXDOMAIN, NoNameservers, Timeout):
            ns_hosts = []

    output = {
        "ns_hosts": ns_hosts,
        "ns_checks": [],
        "ns_delegation": {
            "total_ns": len(ns_hosts),
            "authoritative_ok": 0,
            "lame_count": 0,
            "lame_type": "none",
        },
    }
    if len(ns_hosts) == 0:
        output["ns_delegation"]["lame_type"] = "unknown"
        return output

    for host in ns_hosts:
        row = {
            "ns_host": host,
            "qname": qname,
            "qtype": "SOA",
            "rcode": None,
            "answered_authoritatively": False,
            "error": None,
            "timeout": False,
        }

        try:
            ns_ip = get_ns_ip(host, resolver)
            if ns_ip is None:
                row["error"] = "ns_ip_resolution_failed"
                output["ns_delegation"]["lame_count"] += 1
                output["ns_checks"].append(row)
                continue

            res = probe_nameserver(ns_ip, qname, "SOA", False, timeout_sec)
            row["rcode"] = dns.rcode.to_text(res.rcode())
            row["answered_authoritatively"] = bool(res.flags & dns.flags.AA)

            if row["answered_authoritatively"] and row["rcode"] in [
                "NOERROR",
                "NXDOMAIN",
            ]:
                output["ns_delegation"]["authoritative_ok"] += 1
            else:
                output["ns_delegation"]["lame_count"] += 1
        except Timeout:
            row["timeout"] = True
            row["error"] = "timeout"
            output["ns_delegation"]["lame_count"] += 1
        except Exception as e:
            row["error"] = str(e)
            output["ns_delegation"]["lame_count"] += 1

        output["ns_checks"].append(row)

    ok = output["ns_delegation"]["authoritative_ok"]
    total = output["ns_delegation"]["total_ns"]

    if ok == total:
        output["ns_delegation"]["lame_type"] = "none"
    elif ok == 0:
        output["ns_delegation"]["lame_type"] = "full"
    else:
        output["ns_delegation"]["lame_type"] = "partial"

    return output


def get_registrar_context(base_domain, ns_hosts=None):
    context = {
        "base_domain": base_domain,
        "lookup_success": False,
        "rdap_url": None,
        "registrar_name": None,
        "registrar_id": None,
        "rdap_nameservers": [],
        "delegation_matches_rdap": None,
        "error": None,
    }

    if not base_domain:
        context["error"] = "missing_base_domain"
        return context

    rdap_url = f"https://rdap.org/domain/{base_domain}"
    context["rdap_url"] = rdap_url

    try:
        response = requests.get(rdap_url, timeout=TIMEOUT)
        response.raise_for_status()
        payload = response.json()
    except Exception as e:
        context["error"] = str(e)
        return context

    context["lookup_success"] = True

    nameservers = payload.get("nameservers", [])
    context["rdap_nameservers"] = [
        (ns.get("ldhName") or "").rstrip(".").lower()
        for ns in nameservers
        if ns.get("ldhName")
    ]

    entities = payload.get("entities", [])
    for entity in entities:
        roles = [r.lower() for r in entity.get("roles", [])]
        if "registrar" not in roles:
            continue

        context["registrar_id"] = entity.get("handle")

        vcard = entity.get("vcardArray", [])
        if isinstance(vcard, list) and len(vcard) == 2 and isinstance(vcard[1], list):
            for entry in vcard[1]:
                if not isinstance(entry, list) or len(entry) < 4:
                    continue
                key = entry[0]
                value = entry[3]
                if key in {"fn", "org"} and value:
                    context["registrar_name"] = value
                    break

        if context["registrar_name"] is None:
            public_ids = entity.get("publicIds", [])
            if public_ids:
                context["registrar_name"] = public_ids[0].get("identifier")

        break

    if ns_hosts is not None:
        normalized_hosts = {h.rstrip(".").lower() for h in ns_hosts if h}
        rdap_hosts = set(context["rdap_nameservers"])
        if rdap_hosts:
            context["delegation_matches_rdap"] = normalized_hosts == rdap_hosts

    return context
