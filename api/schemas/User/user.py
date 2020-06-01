import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.auth_functions import is_user_read
from functions.auth_wrappers import require_token
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
            "password",
            "roles",
            "email_validated"
        )

    user_name = EmailAddress(description="Email that the user signed up with")
    display_name = graphene.String(description="Name displayed to other users")
    lang = graphene.String(description="Users preferred language")
    tfa = graphene.Boolean(
        description="Has the user completed two factor authentication"
    )
    email_validated = graphene.Boolean(
        description="Has the user verified their account"
    )
    affiliations = graphene.ConnectionField(
        UserAffClass._meta.connection, description="Users access to organizations"
    )

    def resolve_user_name(self: UserModel, info):
        return self.user_name

    def resolve_display_name(self: UserModel, info):
        return self.display_name

    def resolve_lang(self: UserModel, info):
        return self.preferred_lang

    def resolve_tfa(self: UserModel, info):
        return self.tfa_validated

    def resolve_email_validated(self: UserModel, info):
        return self.email_validated

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
