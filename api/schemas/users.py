import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from schemas.user.user import User
from schemas.organizations import Organization
from models import Users as UserModel
from models import User_affiliations
from models import Organizations
from scalars.email_address import EmailAddress
from enums.roles import RoleEnums


class Users(SQLAlchemyObjectType):
    """
    This object is used to return a list of users with their user name, display
    name and their permission for the requested organization
    """

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

    user_name = EmailAddress(description="Email that the user signed up with")
    display_name = graphene.String(description="Name displayed to other users")
    permission = RoleEnums(
        description="The level of access this user has to the requested " "organization"
    )

    def resolve_user_name(self: User_affiliations, info):
        query = User.get_query(info)
        query = query.filter(Organizations.id == self.organization_id)
        query = query.filter(UserModel.id == self.user_id).first()
        return query.user_name

    def resolve_display_name(self: User_affiliations, info):
        query = User.get_query(info)
        query = query.filter(Organizations.id == self.organization_id)
        query = query.filter(UserModel.id == self.user_id).first()
        return query.display_name

    def resolve_permission(self: User_affiliations, info):
        return self.permission

    def resolve_affiliations(self: User_affiliations, info):
        query = Organization.get_query(info)
        query = query.filter(Organizations.users.user_id == self.id)
        return query.all()


class UserConnection(relay.Connection):
    class Meta:
        node = Users
