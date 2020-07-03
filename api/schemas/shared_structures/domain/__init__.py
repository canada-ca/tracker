import graphene

from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from models import Domains, Web_scans, Mail_scans
from scalars.slug import Slug
from scalars.url import URL
from schemas.shared_structures.domain.mail_scan import MailScan
from schemas.shared_structures.domain.web_scan import WebScan


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
            "dmarc_reports",
        )

    url = URL(description="The domain the scan was run on")
    slug = Slug(description="Slug of the url")
    last_ran = graphene.DateTime(
        description="The last time that a scan was ran on this domain"
    )
    selectors = graphene.List(lambda: graphene.String, description="",)
    organization = ORMField(model_attr="organization")
    email = graphene.ConnectionField(
        MailScan._meta.connection, description="DKIM, DMARC, and SPF scan results"
    )
    web = graphene.ConnectionField(
        WebScan._meta.connection, description="HTTPS, and SSL scan results"
    )

    def resolve_url(self: Domains, info, **kwargs):
        return self.domain

    def resolve_slug(self: Domains, info, **kwargs):
        return self.slug

    def resolve_last_ran(self: Domains, info, **kwargs):
        return self.last_run

    def resolve_selectors(self: Domains, info, **kwargs):
        return self.selectors

    def resolve_email(self: Domains, info, **kwargs):
        query = (
            MailScan.get_query(info)
            .filter(Mail_scans.domain_id == self.id)
            .order_by(Mail_scans.id.desc())
            .all()
        )
        return query

    def resolve_web(self: Domains, info, **kwargs):
        query = (
            WebScan.get_query(info)
            .filter(Web_scans.domain_id == self.id)
            .order_by(Web_scans.id.desc())
            .all()
        )
        return query


class DomainConnection(relay.Connection):
    class Meta:
        node = Domain
