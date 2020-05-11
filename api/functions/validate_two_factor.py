import os

from graphql import GraphQLError

from models import Users as User

from functions.error_messages import *

from db import db_session

import pyotp


def validate_two_factor(user_name, otp_code):
    """
    This function validates that the otp given for a specific user is valid, and if it is,
    authenticates that user's 2FA column in postgres.
    :param user_name - Email address of the user who is going to be validated for 2FA
    :param otp_code - The one time password (otp) that they are attempting to verify
    :returns User object if queried successfully, null if not
    """

    user = User.query.filter(User.user_name == user_name).first()

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    valid_code = pyotp.totp.TOTP(os.getenv("BASE32_SECRET")).verify(otp_code)

    if valid_code:
        user = User.query.filter(User.user_name == user_name).update(
            {"tfa_validated": True}
        )

        db_session.commit()

        user = User.query.filter(User.user_name == user_name).first()

        if not user:
            raise GraphQLError(error_user_not_updated())
        else:
            return user

    else:
        raise GraphQLError(error_otp_code_is_invalid())
