from graphene_sqlalchemy import SQLAlchemyConnectionField

from schemas.find_my_organizations.resolver import resolve_find_my_organizations
from schemas.shared_structures.organizations import Organizations


find_my_organizations = SQLAlchemyConnectionField(
    Organizations._meta.connection,
    sort=None,
    description="Select all information on all organizations that a user "
    "has access to.",
)
