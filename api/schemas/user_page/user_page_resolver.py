from sqlalchemy.orm import load_only
from graphql import GraphQLError

from app import logger
from db import db_session

from models import (
    Users,
    User_affiliations,
)

from schemas.user_page.user_page import UserPage

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read, is_admin


@require_token
def resolve_user_page(self, info, **kwargs):
    """
    This function is used to resolve a users information such as user profile,
    etc. It uses an email address to find which user profile you wish to view
    :param self: User SQLAlchemyObject type defined in the schemas directory
    :param info: Request information sent to the sever from a client
    :param kwargs: Field arguments and user_roles
    :return: Filtered User SQLAlchemyObject Type
    """
    # Get information from kwargs
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    user_name = kwargs.get("user_name", None)

    # Generate user Org ID list
    org_ids = []
    for role in user_roles:
        org_ids.append(role["org_id"])

    # Get initial query
    query = UserPage.get_query(info)

    # Get the requested user
    req_user_orm = (
        db_session.query(Users)
        .filter(Users.user_name == user_name)
        .options(load_only("id"))
        .first()
    )

    # Check to see if user actually exists
    if req_user_orm is None:
        logger.warning(
            f"User: {user_id} tried to access {user_name} but account does not exist."
        )
        raise GraphQLError("Error, user cannot be found.")
    else:
        logger.info(f"User: {user_id} successfully retrieved their own information.")
        req_user_id = req_user_orm.id

    if user_id == req_user_id:
        return query.filter(Users.id == req_user_id).first()

    # Get org id's that the user belongs to
    req_org_orms = (
        db_session.query(User_affiliations)
        .filter(User_affiliations.user_id == req_user_id)
        .options(load_only("organization_id"))
        .all()
    )

    # Check to ensure the user belongs to at least one organization
    if req_org_orms is None:
        raise GraphQLError("Error, user cannot be found.")
    else:
        # Compile list of org id's the user belongs to
        req_user_org_ids = []
        for org_id in req_org_orms:
            req_user_org_ids.append(org_id.organization_id)

    # Check to see if the requested user is a super admin and if true return
    if is_super_admin(user_roles=user_roles):
        logger.info(
            f"Super Admin: {user_id} successfully retrieved {req_user_id} information."
        )
        return query.filter(Users.id == req_user_id).first()

    # Compile list of org id's the user belongs to
    req_user_org_ids = []
    if req_org_orms is not None:
        for org_id in req_org_orms:
            req_user_org_ids.append(org_id.organization_id)

    # Go through each org id that the user belongs to
    for req_org_id in req_user_org_ids:
        # Check to see if the requesting user and requested user belong to
        # the same org
        if req_org_id in org_ids:

            # Check to see if the requesting user has admin rights to org
            if is_admin(user_roles=user_roles, org_id=req_org_id):
                # If admin and user share multiple orgs compile list and
                # return
                logger.info(
                    f"User: {user_id} successfully retrieved {req_user_id} information."
                )
                return query.filter(Users.id == req_user_id).first()

    # If requesting user is not admin, or they do not share orgs return error
    logger.warning(
        f"User: {user_id} tried to access user page for {req_user_id} but does not have proper permissions."
    )
    raise GraphQLError("Error, user cannot be found.")
