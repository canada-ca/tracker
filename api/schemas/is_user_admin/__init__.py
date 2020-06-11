import graphene

from schemas.is_user_admin.is_user_admin import IsUserAdmin
from schemas.is_user_admin.resolver import resolve_is_user_admin

is_user_admin = graphene.Field(
    lambda: IsUserAdmin, resolver=resolve_is_user_admin, description=""
)
