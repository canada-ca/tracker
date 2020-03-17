import pyotp
import os

from sqlalchemy.orm import load_only

from graphql import GraphQLError

from app import app
from db import db

from models import (
    Users,
    User_affiliations,
    Organizations
)

from schemas.users import Users as UsersSchema

from functions.auth_wrappers import require_token
from functions.auth_functions import (
    is_super_admin,
    is_user_read,
    is_admin
)


@require_token
def resolve_users(self, info, **kwargs):
    """

    :param self:
    :param info:
    :param kwargs:
    :return:
    """

    # Get information from kwargs
    user_roles = kwargs.get('user_roles')
    org = kwargs.get('org', None)

    # Generate user Org ID list
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Get initial query
    query = UsersSchema.get_query(info)

    org_orm = db.session.query(Organizations).filter(
        Organizations.acronym == org
    ).first()

    if org_orm is None:
        raise GraphQLError("Error, no organization related to that enum")
    else:
        org_id = org_orm.id

    if is_super_admin(user_role=user_roles):
        user_id_list = db.session.query(User_affiliations).filter(
            User_affiliations.organization_id == org_id
        ).options(load_only("user_id")).subquery()

        query = query.filter(
            User_affiliations.user_id == user_id_list.c.user_id
        ).filter(
            User_affiliations.organization_id == org_id
        )
        return query.all()

    elif is_admin(user_role=user_roles, org_id=org_id):
        user_id_list = db.session.query(User_affiliations).filter(
            User_affiliations.organization_id == org_id
        ).options(load_only("user_id")).subquery()

        query = query.filter(
            User_affiliations.user_id == user_id_list.c.user_id
        ).filter(
            User_affiliations.organization_id == org_id
        )
        return query.all()

    else:
        raise GraphQLError(
            "Error, you do not have access to view this organization"
        )
