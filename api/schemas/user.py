import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from flask_graphql_auth import *

from functions.create_user import create_user
from functions.sign_in_user import sign_in_user
from functions.update_user_password import update_password
from functions.validate_two_factor import validate_two_factor
from functions.update_user_role import update_user_role

from models import Users as User
from scalars.email_address import *


class UserObject(SQLAlchemyObjectType):
    class Meta:
        model = User
        interfaces = (relay.Node,)
        exclude_fields = ("user_password",)


class UserConnection(relay.Connection):
    class Meta:
        node = UserObject


class CreateUser(graphene.Mutation):
    class Arguments:
        display_name = graphene.String(required=True)
        password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)
        user_name = EmailAddress(required=True)

    user = graphene.Field(lambda: UserObject)

    @staticmethod
    def mutate(self, info, display_name, password, confirm_password, user_name):
        user = create_user(display_name, password, confirm_password, user_name)
        return CreateUser(user=user)


class SignInUser(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True, description="User's email")
        password = graphene.String(required=True,
                                   description="Users's password")

    user = graphene.Field(lambda: UserObject)
    auth_token = graphene.String(description="Token returned to user")

    @classmethod
    def mutate(cls, _, info, user_name, password):
        user_dict = sign_in_user(user_name, password)
        return SignInUser(
            auth_token=user_dict['auth_token'],
            user=user_dict['user']
        )


class UpdateUserPassword(graphene.Mutation):
    class Arguments:
        password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)
        user_name = EmailAddress(required=True)

    user = graphene.Field(lambda: UserObject)

    @staticmethod
    def mutate(self, info, password, confirm_password, user_name):
        user = update_password(user_name=user_name, password=password,
                               confirm_password=confirm_password)
        return UpdateUserPassword(user=user)


class ValidateTwoFactor(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        otp_code = graphene.String(required=True)

    user = graphene.Field(lambda: UserObject)

    @staticmethod
    def mutate(self, info, user_name, otp_code):
        user_to_rtn = validate_two_factor(user_name=user_name, otp_code=otp_code)
        return ValidateTwoFactor(user=user_to_rtn)


class UpdateUserRole(graphene.Mutation):
    class Arguments:
        token = graphene.String(required=True)
        user_name = EmailAddress(required=True)
        role = graphene.String(required=True)

    user = graphene.Field(lambda: UserObject)

    @mutation_jwt_required
    def mutate(self, info, user_name, role):
        user = update_user_role(user_name=user_name, new_role=role)
        return UpdateUserRole(user=user)
