import graphene

from graphene_sqlalchemy import SQLAlchemyConnectionField

from scalars.slug import Slug
from schemas.user_list.user_list_item import UserListItem
from schemas.user_list.user_list_item_resolver import resolve_user_item as resolve_user_list

user_list = SQLAlchemyConnectionField(
    UserListItem._meta.connection,
    sort=None,
    org_slug=graphene.Argument(Slug, required=True),
    description="An graphql object that will be used to populate a "
    "userList component in the front end",
)
