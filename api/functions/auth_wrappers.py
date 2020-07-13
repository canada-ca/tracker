import itertools
import os

import jwt
from graphql import GraphQLError

from functions.orm_to_dict import orm_to_dict
from app import logger
from models import User_affiliations, Organizations

user_admin_perm = ["super_admin", "admin"]
user_write_perm = ["super_admin", "admin", "user_write"]
user_read_perm = ["super_admin", "admin", "user_write", "user_read"]


def decode_auth_token(request):
    """
    This function takes in a http requests and decodes the JWT sent by the user
    :param request: The http request sent from the user
    :return: Returns a list of dicts that contains the user claims
    """
    auth_header = request.headers.get("Authorization")
    try:
        payload = jwt.decode(
            auth_header, os.getenv("SUPER_SECRET_SALT"), algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise GraphQLError("Signature expired, please login again")
    except jwt.InvalidTokenError:
        raise GraphQLError("Invalid token, please login again")


def check_user_claims(user_id):
    """
    This function takes the claims the user sent inside the JWT, and checks them
    against the database to see if any changes have been made since they last
    logged in. If a change has occurred they are requested to login again
    :param user_claims: A list of dicts that contain the users claims
    :return: Returns a valid list of user claims
    """
    # XXX: affiliations should have been eager loaded with joinedload
    # when user was initally pulled from the db.
    user_affs = User_affiliations.query.filter(
        User_affiliations.user_id == user_id
    ).all()
    user_affs = orm_to_dict(user_affs)
    user_roles = []
    if user_affs:
        for select in user_affs:
            temp_dict = {
                "user_id": select["user_id"],
                "org_id": select["organization_id"],
                "permission": select["permission"],
            }
            user_roles.append(temp_dict)
    return user_roles


def require_token(method):
    def wrapper(self, *args, **kwargs):
        auth_resp = decode_auth_token(args[0].context)
        if isinstance(auth_resp, dict):
            user_id = auth_resp.get("parameters", {}).get("user_id")
            kwargs["user_id"] = user_id

            user_claims = check_user_claims(user_id)
            kwargs["user_roles"] = user_claims
            return method(self, *args, **kwargs)
        raise GraphQLError(auth_resp)

    return wrapper
