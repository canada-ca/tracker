from sqlalchemy.orm import load_only
from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_admin
from functions.input_validators import cleanse_input
from models import User_affiliations, Organizations
from schemas.users import Users as UsersSchema


@require_token
def resolve_users(self, info, **kwargs):
    """
    This function is used to retrieve a list of users belonging to a requested
    organization, and to access basic user information
    :param self: User SQLAlchemyObject type defined in the schemas directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments and user_roles
    :return: Filtered Users SQLAlchemyObject Type
    """

    # Get information from kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    org_slug = cleanse_input(kwargs.get("org_slug"))

    # Get initial query
    query = UsersSchema.get_query(info)

    # Get requested organization orm
    org_orm = (
        db_session.query(Organizations).filter(Organizations.slug == org_slug).first()
    )

    # Ensure that requested orm exists
    if org_orm is None:
        logger.warning(
            f"User: {user_id} tried to access an organizations users using {org_slug}, but no organization was found."
        )
        raise GraphQLError("Error, unable to find organization.")
    else:
        org_id = org_orm.id

    # Check to see if user has super admin access, and return all users
    if is_super_admin(user_roles=user_roles):
        # Sub query to retrieve all users in the requested organization
        user_id_list = (
            db_session.query(User_affiliations)
            .filter(User_affiliations.organization_id == org_id)
            .options(load_only("user_id"))
            .subquery()
        )

        # Filter results to contain only users belonging to that org, and
        # filter to the requested org
        query = query.filter(
            User_affiliations.user_id == user_id_list.c.user_id
        ).filter(User_affiliations.organization_id == org_id)

        logger.info(f"Super admin: {user_id}, successfully retrieved all users.")
        return query.all()

    # Check if user has admin claim for the requested organization
    elif is_admin(user_roles=user_roles, org_id=org_id):
        # Sub query to retrieve all users in the requested organization
        user_id_list = (
            db_session.query(User_affiliations)
            .filter(User_affiliations.organization_id == org_id)
            .options(load_only("user_id"))
            .subquery()
        )

        # Filter results to contain only users belonging to that org, and
        # filter to the requested org
        query = query.filter(
            User_affiliations.user_id == user_id_list.c.user_id
        ).filter(User_affiliations.organization_id == org_id)

        logger.info(
            f"User: {user_id}, successfully retrieved all users for the {org_slug} organization."
        )
        return query.all()

    else:
        logger.warning(
            f"User: {user_id} tried to access all users from {org_slug} organization, but is not an admin for that organization."
        )
        raise GraphQLError("Error, unable to find organization.")
