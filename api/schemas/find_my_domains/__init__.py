from graphene_sqlalchemy import SQLAlchemyConnectionField

from schemas.find_my_domains.resolver import resolve_find_my_domains
from schemas.shared_structures.domain import Domain

find_my_domains = SQLAlchemyConnectionField(
    Domain._meta.connection,
    sort=None,
    description="Select information on  all domains a user has access to.",
)
