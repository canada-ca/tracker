"""ArangoDB queries used by the CVD enrollment service."""

from arango.database import StandardDatabase


def fetch_domains(db: StandardDatabase) -> tuple[list[dict], list[dict], list[dict]]:
    """Return (all, enrolled, denied) active domains, split by cvdEnrollment status."""
    cursor = db.aql.execute(
        """
        FOR d IN domains
            FILTER d.archived != true
            FILTER d.rcode != "NXDOMAIN"
            RETURN d
        """
    )
    all_domains = list(cursor)
    enrolled = [d for d in all_domains if _enrollment_status(d) == "enrolled"]
    denied = [d for d in all_domains if _enrollment_status(d) == "deny"]
    return all_domains, enrolled, denied


def fetch_domain_owners(db: StandardDatabase, domain_ids: list[str]) -> dict[str, str]:
    """Map each domain id to its owning organization's externalId in one query.

    Domains without an owner are absent from the result.
    """
    if not domain_ids:
        return {}
    cursor = db.aql.execute(
        """
        FOR domain_id IN @domain_ids
            LET owner = FIRST(
                FOR v IN 1..1 INBOUND domain_id ownership
                    RETURN v.externalId
            )
            FILTER owner != null
            RETURN {domain_id, owner}
        """,
        bind_vars={"domain_ids": domain_ids},
    )
    return {row["domain_id"]: row["owner"] for row in cursor}


def _enrollment_status(domain: dict) -> str | None:
    enrollment = domain.get("cvdEnrollment")
    if not isinstance(enrollment, dict):
        return None
    return enrollment.get("status")
