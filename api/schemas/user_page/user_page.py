import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.auth_functions import is_admin, is_super_admin
from functions.auth_wrappers import require_token
from models.Users import Users
from models.User_affiliations import User_affiliations
from scalars.email_address import EmailAddress
from schemas.user_page.user_page_affiliations import UserPageAffiliations


class UserPage(SQLAlchemyObjectType):
    class Meta:
        model = Users
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "user_name",
            "display_name",
            "user_password",
            "preferred_lang",
            "failed_login_attempts",
            "failed_login_attempt_time",
            "tfa_validated",
            "user_affiliation",
            "password",
            "roles",
            "email_validated",
        )

    user_name = EmailAddress(description="The users email address or userName")
    display_name = graphene.String(description="The users display name")
    lang = graphene.String(description="Indicates the preferred language of this user")
    tfa = graphene.Boolean(
        description="Indicates wether or not this user has enabled tfa"
    )
    email_validated = graphene.Boolean(
        description="Has the user verified their account"
    )
    user_affiliations = graphene.List(
        lambda: UserPageAffiliations,
        description="Indicates if this user is an admin of the organization "
        "specified",
    )

    def resolve_user_name(self: Users, info):
        return self.user_name

    def resolve_display_name(self: Users, info):
        return self.display_name

    def resolve_lang(self: Users, info):
        return self.preferred_lang

    def resolve_tfa(self: Users, info):
        return self.tfa_validated

    def resolve_email_validated(self: Users, info):
        return self.email_validated

    @require_token
    def resolve_user_affiliations(self: Users, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        user_id = kwargs.get("user_id")

        if user_id == self.id or is_super_admin(user_roles=user_roles):
            query = UserPageAffiliations.get_query(info)
            query = query.filter(User_affiliations.user_id == self.id)
            return query.all()
        else:
            rtr_list = []
            for role in user_roles:
                if is_admin(user_roles=user_roles, org_id=role.get("org_id")):
                    query = UserPageAffiliations.get_query(info)
                    query = query.filter(
                        User_affiliations.organization_id == role.get("org_id")
                    ).filter(User_affiliations.user_id == self.id)
                    if query.first():
                        rtr_list.append(query.first())
            return rtr_list
