import logging

import dns.rdatatype
from dns.exception import Timeout
from dns.resolver import NXDOMAIN, NoAnswer, NoNameservers, Resolver

logger = logging.getLogger(__name__)

MAX_CNAME_HOPS = 10


def find_final_cname_target(target: str, resolver: Resolver, max_hops: int = MAX_CNAME_HOPS):
    """Follow a CNAME chain starting at target and return the last name in it."""
    seen = {target}
    for _ in range(max_hops):
        try:
            answer = resolver.resolve(qname=target, rdtype=dns.rdatatype.CNAME)
        except Exception:
            # NoAnswer/NXDOMAIN/etc. mean target is the end of the chain (or unresolvable)
            return target
        next_target = answer[0].target.to_text().rstrip(".")
        if next_target in seen:
            return target
        seen.add(next_target)
        target = next_target
    return target


def get_cname_target_rcode(domain: str, target: str, resolver: Resolver):
    """Query the final CNAME target and classify the response as an rcode string."""
    try:
        resolver.resolve(qname=target, rdtype=dns.rdatatype.A)
        return "NOERROR"
    except NoAnswer:
        return "NOERROR"
    except NXDOMAIN:
        return "NXDOMAIN"
    except NoNameservers:
        return "SERVFAIL"
    except Timeout:
        # LifetimeTimeout is a subclass of Timeout
        return "TIMEOUT"
    except Exception as e:
        logger.error(f"Unknown error checking CNAME target '{target}' for {domain}: {e}")
        return None
