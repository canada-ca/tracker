import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Dmarc_scans, Scans, Domains
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
from schemas.domain.email_scan.dmarc.dmarc_tags import DmarcTags


class DMARC(SQLAlchemyObjectType):
    """
    Domain-based Message Authentication, Reporting, and Conformance
    (DMARC) is a scalable mechanism by which a mail-originating
    organization can express domain-level policies and preferences for
    message validation, disposition, and reporting, that a mail-receiving
    organization can use to improve mail handling.
    """

    class Meta:
        model = Dmarc_scans
        exclude_fields = ("id", "dmarc_scan")

    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    dmarc_phase = graphene.Int(description="DMARC Phase found when running scan")
    record = graphene.String(
        description="DMARC record retrieved during the scan of the " "given domain "
    )
    p_policy = graphene.String(
        description="The requested policy you wish mailbox providers to apply "
        "when your email fails DMARC authentication and alignment"
        " checks. "
    )
    sp_policy = graphene.String(
        description="This tag is used to indicate a requested policy for all "
        "subdomains where mail is failing the DMARC "
        "authentication and alignment checks. "
    )
    pct = graphene.Int(
        description="The percentage of messages to which the DMARC policy is "
        "to be applied. "
    )
    dmarc_guidance_tags = graphene.Field(
        lambda: DmarcTags, description="Key tags found during DMARC Scan"
    )

    def resolve_domain(self: Dmarc_scans, info):
        return get_domain(self, info)

    def resolve_timestamp(self: Dmarc_scans, info):
        return get_timestamp(self, info)

    def resolve_dmarc_phase(self: Dmarc_scans, info):
        return self.dmarc_phase

    def resolve_record(self: Dmarc_scans, info):
        return self.dmarc_scan.get("dmarc", {}).get("record", None)

    def resolve_p_policy(self: Dmarc_scans, info):
        return (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("p", {})
            .get("value", None)
        )

    def resolve_sp_policy(self: Dmarc_scans, info):
        return (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("sp", {})
            .get("value", None)
        )

    def resolve_pct(self: Dmarc_scans, info):
        return (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("pct", {})
            .get("value", None)
        )

    def resolve_dmarc_guidance_tags(self: Dmarc_scans, info):
        return DmarcTags.get_query(info).first()
