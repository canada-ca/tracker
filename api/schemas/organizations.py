import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from db import db
from schemas.domain import Domain as DomainsSchema
from models import Domains as DomainsModel
from models import Organizations as OrgModel


class Organization(SQLAlchemyObjectType):
    class Meta:
        model = OrgModel
        interfaces = (relay.Node, )
        exclude_fields = (
            "id",
            "acronym",
            "org_tags"
        )
    acronym = graphene.String()
    description = graphene.String()
    zone = graphene.String()
    sector = graphene.String()
    province = graphene.String()
    city = graphene.String()
    domains = graphene.ConnectionField(
        DomainsSchema._meta.connection
    )

    with app.app_context():
        def resolve_acronym(self: OrgModel, info):
            return self.acronym

        def resolve_description(self: OrgModel, info):
            return self.org_tags["description"]

        def resolve_zone(self: OrgModel, info):
            return self.org_tags["zone"]

        def resolve_sector(self: OrgModel, info):
            return self.org_tags["sector"]

        def resolve_province(self: OrgModel, info):
            return self.org_tags["prov"]

        def resolve_city(self: OrgModel, info):
            return self.org_tags["city"]

        def resolve_domains(self: OrgModel, info):
            query = DomainsSchema.get_query(info)
            return query.filter(
                DomainsModel.organization_id == self.id
            ).all()


class OrganizationConnection(relay.Connection):
    class Meta:
        node = Organization
