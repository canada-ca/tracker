import graphene

from scalars.slug import Slug
from schemas.find_organization_detail_by_slug.resolver import (
    resolve_find_organization_detail_by_slug,
)
from schemas.shared_structures.organization_detail import OrganizationDetail

find_organization_detail_by_slug = graphene.Field(
    lambda: OrganizationDetail,
    slug=graphene.Argument(Slug, required=True),
    resolver=resolve_find_organization_detail_by_slug,
    description="Select all information on a selected organization that a "
    "user has access to.",
)
