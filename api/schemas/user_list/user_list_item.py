import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from db import db_session
from models.Users import Users
from models.User_affiliations import User_affiliations
from scalars.email_address import EmailAddress


class UserListItem(SQLAlchemyObjectType):
    class Meta:
        model = User_affiliations
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "user_id",
            "organization_id",
            "permission",
            "user",
            "user_organization",
        )

    user_name = EmailAddress(description="The users email address or userName")
    display_name = graphene.String(description="The users display name")
    tfa = graphene.Boolean(
        description="Indicates wether or not this user has enabled tfa"
    )
    admin = graphene.Boolean(
        description="Indicates if this user is an admin of the organization "
        "specified in the UserList query"
    )

    def resolve_user_name(self: User_affiliations, info, **kwargs):
        user_orm = (
            db_session.query(Users)
            .filter(Users.id == self.user_id)
            .options(load_only("user_name"))
            .first()
        )
        return user_orm.user_name

    def resolve_display_name(self: User_affiliations, info, **kwargs):
        user_orm = (
            db_session.query(Users)
            .filter(Users.id == self.user_id)
            .options(load_only("display_name"))
            .first()
        )
        return user_orm.display_name

    def resolve_tfa(self: User_affiliations, info, **kwargs):
        user_orm = (
            db_session.query(Users)
            .filter(Users.id == self.user_id)
            .options(load_only("tfa_validated"))
            .first()
        )
        return user_orm.tfa_validated

    def resolve_admin(self: User_affiliations, info, **kwargs):
        if self.permission == "super_admin" or self.permission == "admin":
            return True
        else:
            return False


class UserListItemConnection(relay.Connection):
    class Meta:
        node = UserListItem
