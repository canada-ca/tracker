import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.create_user import create_user
from functions.sign_in_user import sign_in_user
from functions.update_user_password import update_password
from functions.validate_two_factor import validate_two_factor
from functions.auth_functions import is_user_read
from functions.auth_wrappers import require_token

from app import app

from schemas.user_affiliations import UserAffClass

from models import Users as UserModel
from models import User_affiliations

from scalars.email_address import EmailAddress


class User(SQLAlchemyObjectType):
    """
    This object can be queried to retrieve the current logged in users
    information or if the user is an org or super admin they can query a user
    by their user name
    """

    class Meta:
        model = UserModel
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "user_name",
            "display_name",
            "preferred_lang",
            "failed_login_attempts",
            "failed_login_attempt_time",
            "tfa_validated",
            "user_affiliation",
            "user_password",
            "password"
        )

    user_name = EmailAddress(description="Email that the user signed up with")
    display_name = graphene.String(description="Name displayed to other users")
    lang = graphene.String(description="Users preferred language")
    tfa = graphene.Boolean(
        description="Has the user completed two factor authentication"
    )
    affiliations = graphene.ConnectionField(
        UserAffClass._meta.connection, description="Users access to organizations"
    )

    with app.app_context():

        def resolve_user_name(self: UserModel, info):
            return self.user_name

        def resolve_display_name(self: UserModel, info):
            return self.display_name

        def resolve_lang(self: UserModel, info):
            return self.preferred_lang

        def resolve_tfa(self: UserModel, info):
            return self.tfa_validated

        @require_token
        def resolve_affiliations(self: UserModel, info, **kwargs):
            user_roles = kwargs.get("user_roles")
            rtr_list = []

            for role in user_roles:
                if is_user_read(user_roles=user_roles, org_id=role["org_id"]):
                    query = UserAffClass.get_query(info)
                    query = query.filter(
                        User_affiliations.organization_id == role["org_id"]
                    ).filter(User_affiliations.user_id == self.id)
                    rtr_list.append(query.first())
            return rtr_list


class UserConnection(relay.Connection):
    class Meta:
        node = User


class CreateUser(graphene.Mutation):
    class Arguments:
        display_name = graphene.String(required=True)
        password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)
        user_name = EmailAddress(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, display_name, password, confirm_password, user_name):
        user = create_user(display_name, password, confirm_password, user_name)
        return CreateUser(user=user)


class SignInUser(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True, description="User's email")
        password = graphene.String(required=True, description="Users's password")

    user = graphene.Field(lambda: User)
    auth_token = graphene.String(description="Token returned to user")

    @classmethod
    def mutate(cls, _, info, user_name, password):
        user_dict = sign_in_user(user_name, password)
        return SignInUser(
            auth_token=str(user_dict["auth_token"]), user=user_dict["user"]
        )


class UpdateUserPassword(graphene.Mutation):
    class Arguments:
        password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)
        user_name = EmailAddress(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, password, confirm_password, user_name):
        user = update_password(
            user_name=user_name, password=password, confirm_password=confirm_password
        )
        return UpdateUserPassword(user=user)


class ValidateTwoFactor(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        otp_code = graphene.String(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, user_name, otp_code):
        user_to_rtn = validate_two_factor(user_name=user_name, otp_code=otp_code)
        return ValidateTwoFactor(user=user_to_rtn)
