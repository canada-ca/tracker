import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from models import Domains, Web_scans, Mail_scans
from scalars.slug import Slug
from scalars.url import URL
from resolvers.dmarc_report import resolve_dmarc_reports
from schemas.domain.mail_scan import MailScan
from schemas.domain.web_scan import WebScan
from schemas.domain.dmarc_report import DmarcReport


class Domain(SQLAlchemyObjectType):
    class Meta:
        model = Domains
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "domain",
            "last_run",
            "selectors",
            "organization_id",
            "organization",
            "web_scans",
            "mail_scans",
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
        MailScan._meta.connection, description="DKIM, DMARC, and SPF scan results"
    )
    web = graphene.ConnectionField(
        WebScan._meta.connection, description="HTTPS, and SSL scan results"
    )

    def resolve_url(self: Domains, info):
        return self.domain

    def resolve_slug(self: Domains, info):
        return self.slug

    def resolve_last_ran(self: Domains, info):
        return self.last_run

    def resolve_mail(self: Domains, info):
        query = MailScan.get_query(info)
        query = query.filter(Mail_scans.domain_id == self.id)
        return query.all()

    def resolve_web(self: Domains, info):
        query = WebScan.get_query(info)
        query = query.filter(Web_scans.domain_id == self.id)
        return query.all()


class DomainConnection(relay.Connection):
    class Meta:
        node = Domain
