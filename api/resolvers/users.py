import pyotp
import os

from app import app
from db import db

from models import Users

from schemas.user import UserObject as UserSchema


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
    user_email = kwargs.get('user_email', None)

    # Generate user Org ID list
    org_id_list = []
    for role in user_roles:
        org_id_list.append(role["org_id"])

    # Get initial query
    query = UserSchema.get_query(info)

    if user_email is not None:




def resolve_generate_otp_url(self, info, email):
    """
    This resolver adds an api endpoint that returns a url for OTP validation
    :param email: The email address that will be associated with the URL generated
    :returns: The url that was generated.
    """
    totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
    return totp.provisioning_uri(email, issuer_name="Tracker")
