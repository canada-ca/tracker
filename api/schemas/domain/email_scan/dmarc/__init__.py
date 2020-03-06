import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans

from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp

from schemas.domain.email_scan.dmarc.dmarc_record import DmarcRecord
from schemas.domain.email_scan.dmarc.pp_policy import PPPolicy
from schemas.domain.email_scan.dmarc.sp_policy import SPPolicy
from schemas.domain.email_scan.dmarc.pct import Pct
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
        exclude_fields = (
            "id", "dmarc_scan"
        )
    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    record = graphene.List(
        lambda: DmarcRecord,
        description="DMARC record retrieved during the scan of the "
                    "given domain "
    )
    p_policy = graphene.List(
        lambda: PPPolicy,
        description="The requested policy you wish mailbox providers to apply "
                    "when your email fails DMARC authentication and alignment"
                    " checks. "
    )
    sp_policy = graphene.List(
        lambda: SPPolicy,
        description="This tag is used to indicate a requested policy for all "
                    "subdomains where mail is failing the DMARC "
                    "authentication and alignment checks. "
    )
    pct = graphene.List(
        lambda: Pct,
        description="The percentage of messages to which the DMARC policy is "
                    "to be applied. "
    )
    dmarc_guidance_tags = graphene.List(
        lambda: DmarcTags,
        description="Key tags found during DMARC Scan"
    )

    with app.app_context():
        def resolve_domain(self: Dmarc_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Dmarc_scans, info):
            return get_timestamp(self, info)

        def resolve_record(self: Dmarc_scans, info):
            return DmarcRecord.get_query(info).all()

        def resolve_p_policy(self: Dmarc_scans, info):
            return PPPolicy.get_query(info).all()

        def resolve_sp_policy(self: Dmarc_scans, info):
            return SPPolicy.get_query(info).all()

        def resolve_pct(self: Dmarc_scans, info):
            return Pct.get_query(info).all()

        def resolve_dmarc_guidance_tags(self: Dmarc_scans, info):
            return DmarcTags.get_query(info).all()
