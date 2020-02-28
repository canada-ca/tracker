import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.update_user_role import update_user_role

from model_enums.organiztions import OrganizationsEnum
from model_enums.roles import RoleEnums
from scalars.email_address import EmailAddress

from models import User_affiliations as UserAff
from schemas.user import UserObject

from functions.auth_wrappers import require_token


class UserAffClass(SQLAlchemyObjectType):
    class Meta:
        model = UserAff
        interfaces = (relay.Node,)


class UserAffConnection(relay.Connection):
    class Meta:
        node = UserAffClass


class UpdateUserRole(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        org = OrganizationsEnum(required=True)
        role = RoleEnums(required=True)

    user = graphene.Field(lambda: UserObject)
    status = graphene.String()

    @require_token
    def mutate(self, info, **kwargs):
        user = update_user_role(**kwargs)
        return UpdateUserRole(user=user, status="Update Successful")
