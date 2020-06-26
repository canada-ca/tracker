from base64 import b64encode

import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from schemas.shared_structures.domain import Domain as DomainsSchema
from scalars.organization_acronym import Acronym
from scalars.slug import Slug
from models import Domains as DomainsModel
from models import Organizations as OrgModel


class OrganizationDetail(SQLAlchemyObjectType):
    class Meta:
        model = OrgModel
        exclude_fields = (
            "id",
            "acronym",
            "org_tags",
            "domains",
            "users",
            "slug",
            "name",
        )

    id = graphene.ID(description="The id of the organization.")
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
    domain_count = graphene.Int(
        description="The number of domains associated with this organization."
    )

    def resolve_domain_count(self: OrgModel, info):
        return self.domain_count

    def resolve_id(self: OrgModel, info):
        return b64encode("Organization:{}".format(self.id).encode("ascii")).decode(
            "utf-8"
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
        query = query.filter(DomainsModel.organization_id == self.id).all()
        return query
