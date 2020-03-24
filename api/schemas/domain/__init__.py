import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from app import app
from models import Domains, Scans, Dmarc_Reports
from scalars.url import URL

from schemas.domain.email_scan import EmailScan
from schemas.domain.www_scan import WWWScan
from schemas.dmarc_report import DmarcReport


class Domain(SQLAlchemyObjectType):
    class Meta:
        model = Domains
        interfaces = (relay.Node, )
        exclude_fields = (
            "id",
            "domain",
            "last_run",
            "dmarc_phase",
            "organization_id",
            "organization",
            "scans"
        )
    url = URL(description="The domain the scan was run on")
    organization = ORMField(model_attr="organization")
    email = graphene.ConnectionField(
        EmailScan._meta.connection,
        description="DKIM, DMARC, and SPF scan results"
    )
    www = graphene.ConnectionField(
        WWWScan._meta.connection,
        description="HTTPS, and SSL scan results"
    )
    dmarc_report = graphene.ConnectionField(
        DmarcReport._meta.connection,
        description="DMARC aggregate report"
    )

    with app.app_context():
        def resolve_url(self: Domains, info):
            return self.domain

        def resolve_email(self: Domains, info):
            query = EmailScan.get_query(info)
            query = query.filter(
                Scans.domain_id == self.id
            )
            return query.all()

        def resolve_www(self: Domains, info):
            query = WWWScan.get_query(info)
            query = query.filter(
                Scans.domain_id == self.id
            )
            return query.all()

        def resolve_dmarc_report(self: Domains, info):
            query = DmarcReport.get_query(info)
            query = query.filter(
                Dmarc_Reports.id == self.id
            )
            return query.all()


class DomainConnection(relay.Connection):
    class Meta:
        node = Domain
