import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans

from scalars.url import URL

from schemas.domain.email_scan.shared_functions import get_timestamp, get_domain

from schemas.domain.email_scan.spf.spf_default import SPFDefault
from schemas.domain.email_scan.spf.spf_lookups import SPFLookups
from schemas.domain.email_scan.spf.spf_record import SPFRecord
from schemas.domain.email_scan.spf.spf_tags import SPFTags


class SPF(SQLAlchemyObjectType):
    """
    Email on the Internet can be forged in a number of ways.  In
    particular, existing protocols place no restriction on what a sending
    host can use as the "MAIL FROM" of a message or the domain given on
    the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
    protocol is where ADministrative Management Domains (ADMDs) can explicitly
    authorize the hosts that are allowed to use their domain names, and a
    receiving host can check such authorization.
    """
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    lookups = graphene.List(
        lambda: SPFLookups,
        description="The current amount of DNS lookups"
    )
    record = graphene.List(
        lambda: SPFRecord,
        description="SPF record retrieved during the scan of the "
                    "given domain "
    )
    spf_default = graphene.List(
        lambda: SPFDefault,
        description="Instruction of what a recipient should do if there is "
                    "not a match to your SPF record. "
    )
    spf_guidance_tags = graphene.List(
        lambda: SPFTags,
        description="Key tags found during SPF scan"
    )

    with app.app_context():
        def resolve_domain(self: Spf_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Spf_scans, info):
            return get_timestamp(self, info)

        def resolve_lookups(self: Spf_scans, info):
            return SPFLookups.get_query(info).all()

        def resolve_record(self: Spf_scans, info):
            return SPFRecord.get_query(info).all()

        def resolve_spf_default(self: Spf_scans, info):
            return SPFDefault.get_query(info).all()

        def resolve_spf_guidance_tags(self: Spf_scans, info):
            return SPFTags.get_query(info).all()
