import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from models import Domains, Scans
from scalars.slug import Slug
from scalars.url import URL
from resolvers.dmarc_report import resolve_dmarc_reports
from schemas.domain.email_scan import EmailScan
from schemas.domain.www_scan import WWWScan


class Domain(SQLAlchemyObjectType):
    class Meta:
        model = Domains
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "domain",
            "last_run",
            "dmarc_phase",
            "organization_id",
            "organization",
            "scans",
            "slug",
            "dmarc_reports"
        )

    url = URL(description="The domain the scan was run on")
    slug = Slug(description="Slug of the url")
    last_ran = graphene.DateTime(
        description="The last time that a scan was ran on this domain"
    )
    organization = ORMField(model_attr="organization")
    email = graphene.ConnectionField(
        EmailScan._meta.connection, description="DKIM, DMARC, and SPF scan results"
    )
    www = graphene.ConnectionField(
        WWWScan._meta.connection, description="HTTPS, and SSL scan results"
    )

    def resolve_url(self: Domains, info):
        return self.domain

    def resolve_slug(self: Domains, info):
        return self.slug

    def resolve_last_ran(self: Domains, info):
        return self.last_run

    def resolve_email(self: Domains, info):
        query = EmailScan.get_query(info)
        query = query.filter(Scans.domain_id == self.id)
        return query.all()

    def resolve_www(self: Domains, info):
        query = WWWScan.get_query(info)
        query = query.filter(Scans.domain_id == self.id)
        return query.all()


class DomainConnection(relay.Connection):
    class Meta:
        node = Domain
