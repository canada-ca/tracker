import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from app import app
from models import Domains
from scalars.url import URL
from schemas.domain.email_scan import EmailScan


class Domain(SQLAlchemyObjectType):
    class Meta:
        model = Domains
        interfaces = (relay.Node, )
        exclude_fields = (
            "id", "domain",
            "last_run", "dmarc_phase",
            "organization_id", "organization",
            "scans"
        )
    dns = graphene.String()
    url = URL()
    www = graphene.String()
    email = graphene.ConnectionField(EmailScan._meta.connection)
    organization = ORMField(model_attr='organization')

    with app.app_context():
        def resolve_url(self: Domains, info):
            return self.domain

        def resolve_email(self, info):
            query = EmailScan.get_query(info)
            return query.all()
