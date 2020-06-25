from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import (
    is_super_admin,
    is_admin,
    is_user_write,
    is_user_read,
)
from functions.input_validators import cleanse_input
from models import Organizations as Orgs


@require_token
def resolve_test_user_claims(self, info, **kwargs):
    """
    This resolver returns the user_claims array -- A utility for testing
    It requires that a JWT token be active, and that the user have an admin role
    :returns: Returns the user_claims if user is an admin, raises error message if not.
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    test_role = kwargs.get("role")
    org_slug = cleanse_input(kwargs.get("org_slug"))

    org_orm = db_session.query(Orgs).filter(Orgs.slug == org_slug).first()
    org_id = org_orm.id

    if test_role == "super_admin":
        if is_super_admin(user_roles=user_roles):
            logger.info(f"User: {user_id} passed the super admin claims test.")
            return "User Passed Super Admin Claim"
        else:
            logger.info(f"User: {user_id} failed the super admin claims test.")
            raise GraphQLError("Error, user is not a super admin")

    elif test_role == "admin":
        if is_admin(user_roles=user_roles, org_id=org_id):
            logger.info(
                f"User: {user_id} passed the admin claims test for this organization: {org_slug}."
            )
            return "User Passed Admin Claim"
        else:
            logger.info(
                f"User: {user_id} failed the admin claims test for this organization: {org_slug}."
            )
            raise GraphQLError("Error, user is not an admin for that org")

    elif test_role == "user_write":
        if is_user_write(user_roles=user_roles, org_id=org_id):
            logger.info(
                f"User: {user_id} passed the user write claims test for this organization: {org_slug}."
            )
            return "User Passed User Write Claim"
        else:
            logger.info(
                f"User: {user_id} failed the user write claims test for this organization: {org_slug}."
            )
            raise GraphQLError("Error, user cannot write to that org")

    elif test_role == "user_read":
        if is_user_read(user_roles=user_roles, org_id=org_id):
            logger.info(
                f"User: {user_id} passed the user read claims test for this organization: {org_slug}."
            )
            return "User Passed User Read Claim"
        else:
            logger.info(
                f"User: {user_id} failed the user read claims test for this organization: {org_slug}."
            )
            raise GraphQLError("Error, user cannot read that org")

    else:
        logger.warning(f"User: {user_id} has no roles assigned.")
        raise GraphQLError("Error, user has no permissions")
