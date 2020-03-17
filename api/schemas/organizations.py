import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from app import app

from schemas.domain import Domain as DomainsSchema
from schemas.user_affiliations import UserAffClass

from models import Domains as DomainsModel
from models import Organizations as OrgModel
from models import User_affiliations as UserAffModel

from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token


class Organization(SQLAlchemyObjectType):
    class Meta:
        model = OrgModel
        interfaces = (relay.Node, )
        exclude_fields = (
            "id",
            "acronym",
            "org_tags",
            "domains",
            "users"
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
    affiliated_users = graphene.ConnectionField(
        UserAffClass._meta.connection
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

        def resolve_affiliated_users(self: OrgModel, info):
            query = UserAffClass.get_query(info)
            query = query.filter(
                UserAffModel.organization_id == self.id
            ).all()
            return query


class OrganizationConnection(relay.Connection):
    class Meta:
        node = Organization
