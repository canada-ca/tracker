from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_functions import is_admin, is_super_admin
from functions.input_validators import cleanse_input
from models import Users as User
from models import Organizations as Orgs
from models import User_affiliations as User_aff


def update_user_role(**kwargs):
    """
    Updates the user role associate with the user given by email address
    :param kwargs: Contains user_name, org, and new role
    :returns user: The newly updated user object retrieved from the DB (after the update is committed).
    """
    user_id = kwargs.get("user_id")
    user_roles = kwargs.get("user_roles")
    user_name = cleanse_input(kwargs.get("input", {}).get("user_name"))
    org_slug = cleanse_input(kwargs.get("input", {}).get("org_slug"))
    new_role = cleanse_input(kwargs.get("input", {}).get("role"))

    # Gather requested user
    user = db_session.query(User).filter(User.user_name == user_name).first()

    # Check to see if user actually exists
    if user is None:
        logger.warning(
            f"User: {user_id} attempted to update user role for {user_name}, but no account is associated with that username."
        )
        raise GraphQLError("Error, unable to update user role.")

    # Gather requested organization
    org_orm = db_session.query(Orgs).filter(Orgs.slug == org_slug).first()

    # Check to see that org actually exists
    if org_orm is None:
        logger.warning(
            f"User: {user_id} attempted to a users permission for {org_slug}, but no organization associated with that slug."
        )
        raise GraphQLError("Error, unable to update user role.")

    # Check to see if the user belongs to super admin org
    super_admin_affiliation_check = (
        db_session.query(User_aff)
        .filter(User_aff.user_id == user.id)
        .filter(User_aff.organization_id == org_orm.id)
        .first()
    )

    # Check if requesting user has correct permissions
    if (
        new_role == "super_admin"
        and org_slug == "super-admin"
        and super_admin_affiliation_check is not None
        and is_super_admin(user_roles=user_roles) is True
    ):
        update_user_role_db(admin_id=user_id, user=user, org=org_orm, role=new_role)
    elif (
        new_role == "user_read"
        or new_role == "user_write"
        or new_role == "admin"
        and is_admin(user_roles=user_roles, org_id=org_orm.id) is True
    ):
        update_user_role_db(admin_id=user_id, user=user, org=org_orm, role=new_role)
    else:
        logger.warning(
            f"User: {user_id} attempted to update {user.id}'s role, but they do not have the permission to {org_slug}."
        )
        raise GraphQLError("Error, unable to update user role.")


def update_user_role_db(admin_id, user, org, role):
    try:
        # Update user role
        db_session.query(User_aff).filter(User_aff.organization_id == org.id).filter(
            User_aff.user_id == user.id
        ).update({"permission": role})

        logger.info(
            f"User: {admin_id} successfully updated {user.id}'s role to {role}."
        )
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        db_session.flush()
        logger.error(
            f"User: {admin_id} attempted to update {user.id}'s role, but a db error occurred: {str(e)}"
        )
        raise GraphQLError("Error, unable to update user role.")
