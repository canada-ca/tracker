import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from enums.roles import RoleEnums
from models import User_affiliations as UserAff


class UserAffClass(SQLAlchemyObjectType):
    class Meta:
        model = UserAff
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "user_id",
            "organization_id",
            "permission",
            "user",
            "user_organization",
        )

    user_id = graphene.Int(description="User's ID")
    user = ORMField(model_attr="user")
    permission = RoleEnums(description="User's level of access to a given organization")
    organization = ORMField(
        model_attr="user_organization",
        description="The organization this affiliation belongs to",
    )

    def resolve_user_id(self: UserAff, info, **kwargs):
        return self.user_id

    def resolve_permission(self: UserAff, info, **kwargs):
        return self.permission


class UserAffConnection(relay.Connection):
    class Meta:
        node = UserAffClass
