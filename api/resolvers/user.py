import pyotp
import os

from sqlalchemy.orm import load_only

from graphql import GraphQLError

from app import app
from db import db_session

from models import Users, User_affiliations, Organizations

from schemas.user import User as UserSchema

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read, is_admin


@require_token
def resolve_user(self, info, **kwargs):
    """
    This function is used to resolve a users information such as user profile,
    etc. If an email address argument is present then the user will have to be
    an admin belonging to the same org to see the users information.
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
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Get initial query
    query = UserSchema.get_query(info)

    # Check to see if user is requesting a specific user
    if user_name is not None:
        # Get the requested user
        req_user_orm = (
            db_session.query(Users)
            .filter(Users.user_name == user_name)
            .options(load_only("id"))
            .first()
        )

        # Check to see if user actually exists
        if req_user_orm is None:
            raise GraphQLError("Error, user cannot be found")
        else:
            req_user_id = req_user_orm.id

        # Get org id's that the user belongs to
        req_org_orm = (
            db_session.query(User_affiliations)
            .filter(User_affiliations.user_id == req_user_id)
            .options(load_only("organization_id"))
            .all()
        )

        # Check to ensure the user belongs to at least one organization
        if req_org_orm is None:
            raise GraphQLError("Error, user does not belong to any organization")
        else:
            # Compile list of org id's the user belongs to
            req_user_org_id_list = []
            for org_id in req_org_orm:
                req_user_org_id_list.append(org_id.organization_id)

        # Check to see if the requested user is a super admin and if true return
        if is_super_admin(user_role=user_roles):
            return query.filter(Users.id == req_user_id)

        # Declare return list, and check
        rtn_query = []
        user_check = True

        # Go through each org id that the user belongs to
        for req_org_id in req_user_org_id_list:
            # Check to see if the requesting user and requested user belong to
            # the same org
            if req_org_id in org_id_list:
                # Set check flag
                user_check = False

                # Check to see if the requesting user has admin rights to org
                if is_admin(user_role=user_roles, org_id=req_org_id):
                    # If admin and user share multiple orgs compile list and
                    # return
                    rtn_query.append(query.filter(Users.id == req_user_id).first())
                else:
                    raise GraphQLError(
                        "Error, you do not have permission to view this users"
                        " information"
                    )
                return rtn_query

        # Give error if requesting user and requested user do not share an org
        if user_check:
            raise GraphQLError(
                "Error, user does not belong to any of your organizations"
            )
    # Return user profile of requesting user
    else:
        return query.filter(Users.id == user_id)


def resolve_generate_otp_url(self, info, email):
    """
    This resolver adds an api endpoint that returns a url for OTP validation
    :param email: The email address that will be associated with the URL generated
    :returns: The url that was generated.
    """
    totp = pyotp.totp.TOTP(
        os.getenv("BASE32_SECRET")
    )  # This needs to be a 16 char base32 secret key
    return totp.provisioning_uri(email, issuer_name="Tracker")
