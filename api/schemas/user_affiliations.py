import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField

from app import app

from functions.update_user_role import update_user_role

from model_enums.roles import RoleEnums

from scalars.organization_acronym import Acronym
from scalars.email_address import EmailAddress

from models import User_affiliations as UserAff

from functions.auth_wrappers import require_token


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

    with app.app_context():

        def resolve_user_id(self: UserAff, info):
            return self.user_id

        def resolve_permission(self: UserAff, info):
            return self.permission


class UserAffConnection(relay.Connection):
    class Meta:
        node = UserAffClass


class UpdateUserRole(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        org = Acronym(required=True)
        role = RoleEnums(required=True)

    # user = graphene.Field(lambda: UserObject)
    status = graphene.String()

    @require_token
    def mutate(self, info, **kwargs):
        user = update_user_role(**kwargs)
        return UpdateUserRole(status="Update Successful")
