import graphene

from scalars.slug import Slug
from schemas.find_domain_by_slug.resolver import resolve_find_domain_by_slug
from schemas.shared_structures.domain import Domain


class FindDomainBySlugInput(graphene.InputObjectType):
    """
    This object contains the fields required for the findDomainsBySlug query
    """

    url_slug = Slug(
        required=True,
        description="Slugified version of the domain that you are requesting "
        "information on.",
    )


find_domain_by_slug = graphene.Field(
    lambda: Domain,
    input=FindDomainBySlugInput(
        required=True,
        description="Input object containing required fields for the findDomainsBySlug query",
    ),
    description="Select information on a specific domain.",
    resolver=resolve_find_domain_by_slug,
)
