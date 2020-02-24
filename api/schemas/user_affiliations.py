import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from flask_graphql_auth import *

from functions.update_user_role import update_user_role

from model_enums.organiztions import OrganizationsEnum
from model_enums.roles import RoleEnums
from scalars.email_address import *

from models import User_affiliations as UserAff
from schemas.user import UserObject


class UserAffClass(SQLAlchemyObjectType):
    class Meta:
        model = UserAff
        interfaces = (relay.Node,)


class UserAffConnection(relay.Connection):
    class Meta:
        node = UserAffClass


class UpdateUserRole(graphene.Mutation):
    class Arguments:
        token = graphene.String(required=True)
        user_name = EmailAddress(required=True)
        org = OrganizationsEnum(required=True)
        role = RoleEnums(required=True)

    user = graphene.Field(lambda: UserObject)
    status = graphene.String()

    @mutation_jwt_required
    def mutate(self, info, user_name, org, role):
        user = update_user_role(user_name=user_name, org=org, new_role=role)
        return UpdateUserRole(user=user, status="Update Successful")
