import graphene

from graphene_sqlalchemy import SQLAlchemyConnectionField

from scalars.slug import Slug
from schemas.find_domains_by_org.resolver import resolve_find_domains_by_org
from schemas.shared_structures.domain import Domain

find_domains_by_org = SQLAlchemyConnectionField(
    Domain._meta.connection,
    org_slug=graphene.Argument(Slug, required=True),
    sort=None,
    description="Select information on an organizations domains.",
)
