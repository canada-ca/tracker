import graphene

from scalars.slug import Slug
from schemas.find_domain_detail_by_slug.resolver import resolve_find_domain_by_slug
from schemas.shared_structures.domain import Domain

find_domain_by_slug = graphene.List(
    lambda: Domain,
    url_slug=graphene.Argument(Slug, required=True),
    description="Select information on a specific domain.",
    resolver=resolve_find_domain_by_slug,
)
