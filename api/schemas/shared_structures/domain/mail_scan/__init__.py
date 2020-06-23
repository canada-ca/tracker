import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
from models import Mail_scans, Dmarc_scans, Spf_scans, Dkim_scans
from scalars.url import URL
from schemas.shared_structures.domain.mail_scan.dkim import DKIM
from schemas.shared_structures.domain.mail_scan.dmarc import DMARC
from schemas.shared_structures.domain.mail_scan.spf import SPF


class MailScan(SQLAlchemyObjectType):
    """
    Results of DKIM, DMARC, and SPF scans, on domains
    """

    class Meta:
        model = Mail_scans
        interfaces = (relay.Node,)
        exclude_fields = ("id", "domain_id", "scan_date", "initiated_by")

    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    dmarc_phase = graphene.Int(
        description="DMARC implementation phase detected when running scan"
    )
    selectors = graphene.List(
        description="List of DKIM selector strings to scan", of_type=graphene.String
    )
    dmarc = graphene.Field(
        lambda: DMARC,
        description="Domain-based Message Authentication, Reporting, "
        "and Conformance (DMARC) ",
    )
    spf = graphene.Field(
        lambda: SPF,
        description="Sender Policy Framework (SPF) for Authorizing Use of "
        "Domains in Email ",
    )
    dkim = graphene.Field(
        lambda: DKIM, description="DomainKeys Identified Mail (DKIM) Signatures"
    )

    def resolve_domain(self: Mail_scans, info):
        return get_domain(self, info)

    def resolve_timestamp(self: Mail_scans, info):
        return get_timestamp(self, info)

    def resolve_dmarc(self: Mail_scans, info):
        query = DMARC.get_query(info)
        return query.filter(self.id == Dmarc_scans.id).first()

    def resolve_spf(self: Mail_scans, info):
        query = SPF.get_query(info)
        return query.filter(self.id == Spf_scans.id).first()

    def resolve_dkim(self: Mail_scans, info):
        query = DKIM.get_query(info)
        return query.filter(self.id == Dkim_scans.id).first()


class MailScanConnection(relay.Connection):
    class Meta:
        node = MailScan
