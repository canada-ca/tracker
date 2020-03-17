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

from schemas.user import User as UserSchema

from functions.auth_wrappers import require_token
from functions.auth_functions import (
    is_super_admin,
    is_user_read,
    is_admin
)


@require_token
def resolve_user(self, info, **kwargs):
    """
    This function is used to resolve a users information such as user profile,
    etc. If an email address argument is present then the user will have to be
    an admin belonging to the same org to see the users information.
    :param self:
    :param info:
    :param kwargs:
    :return:
    """
    # Get information from kwargs
    user_id = kwargs.get('user_id')
    user_roles = kwargs.get('user_roles')
    user_name = kwargs.get('user_name', None)

    # Generate user Org ID list
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Get initial query
    query = UserSchema.get_query(info)

    if user_name is not None:
        req_user_orm = db.session.query(Users).filter(
            Users.user_name == user_name
        ).options(load_only('id')).first()

        if req_user_orm is None:
            raise GraphQLError('Error, user cannot be found')
        else:
            req_user_id = req_user_orm.id

        req_org_orm = db.session.query(User_affiliations).filter(
            User_affiliations.user_id == req_user_id
        ).options(load_only('organization_id')).first()

        if req_org_orm is None:
            raise GraphQLError("Error, user does not belong to any organization")
        else:
            req_org_id = req_org_orm.organization_id

        if is_super_admin(user_role=user_roles):
            return query.filter(Users.id == req_user_id)

        if req_org_id in org_id_list:
            if is_admin(user_role=user_roles, org_id=req_org_id):
                return query.filter(Users.id == req_user_id)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to view this users"
                    " information"
                )
        else:
            raise GraphQLError(
                "Error, user does not belong to any of your organizations"
            )
    else:
        return query.filter(Users.id == user_id)


def resolve_generate_otp_url(self, info, email):
    """
    This resolver adds an api endpoint that returns a url for OTP validation
    :param email: The email address that will be associated with the URL generated
    :returns: The url that was generated.
    """
    totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
    return totp.provisioning_uri(email, issuer_name="Tracker")
