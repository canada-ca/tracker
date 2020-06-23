import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from schemas.shared_structures.domain import Domain as DomainsSchema
from schemas.user_affiliations import UserAffClass
from scalars.organization_acronym import Acronym
from scalars.slug import Slug
from models import Domains as DomainsModel
from models import Organizations as OrgModel
from models import User_affiliations as UserAffModel
from functions.auth_functions import is_admin
from functions.auth_wrappers import require_token


class Organization(SQLAlchemyObjectType):
    class Meta:
        model = OrgModel
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "acronym",
            "org_tags",
            "domains",
            "users",
            "slug",
            "name",
        )

    acronym = Acronym(description="The acronym of the organization.")
    name = graphene.String(description="The full name of the organization.")
    slug = Slug(description="Slug of the organizations name")
    zone = graphene.String(description="The zone which the organization belongs to.")
    sector = graphene.String(description="The sector which the organizaion belongs to.")
    province = graphene.String(
        description="The province in which the organization resides."
    )
    city = graphene.String(description="The city in which the organization resides.")
    domains = graphene.ConnectionField(
        DomainsSchema._meta.connection,
        description="The domains which belong to this organization.",
    )
    affiliated_users = graphene.ConnectionField(
        UserAffClass._meta.connection,
        description="The users that have an affiliation with the organization.",
    )

    def resolve_acronym(self: OrgModel, info):
        return self.acronym

    def resolve_name(self: OrgModel, info):
        return self.name

    def resolve_slug(self: OrgModel, info):
        return self.slug

    def resolve_zone(self: OrgModel, info):
        return self.org_tags.get("zone", None)

    def resolve_sector(self: OrgModel, info):
        return self.org_tags.get("sector", None)

    def resolve_province(self: OrgModel, info):
        return self.org_tags.get("province", None)

    def resolve_city(self: OrgModel, info):
        return self.org_tags.get("city", None)

    def resolve_domains(self: OrgModel, info):
        query = DomainsSchema.get_query(info)
        return query.filter(DomainsModel.organization_id == self.id).all()

    @require_token
    def resolve_affiliated_users(self: OrgModel, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        if is_admin(user_roles=user_roles, org_id=self.id):
            query = UserAffClass.get_query(info)
            query = query.filter(UserAffModel.organization_id == self.id).all()
            return query
        else:
            return []


class OrganizationConnection(relay.Connection):
    class Meta:
        node = Organization
