import graphene

from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from db import db_session
from models.User_affiliations import User_affiliations
from models.Organizations import Organizations
from scalars.organization_acronym import Acronym


class UserPageAffiliations(SQLAlchemyObjectType):
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

    admin = graphene.Boolean(
        description="Indicates if this user is an admin of the organization"
    )
    organization = Acronym(
        description="Indicates which organization this users data is being "
        "displayed for"
    )

    with app.app_context():

        def resolve_admin(self: User_affiliations, info):
            if self.permission == "super_admin" or self.permission == "admin":
                return True
            else:
                return False

        def resolve_organization(self: User_affiliations, info):
            org_orm = (
                db_session.query(Organizations)
                .filter(Organizations.id == self.organization_id)
                .first()
            )
            return org_orm.acronym
