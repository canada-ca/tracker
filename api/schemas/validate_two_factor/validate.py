import os
import pyotp

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.error_messages import *
from models import Users


def validate_two_factor(user_name, otp_code):
    """
    This function validates that the otp given for a specific user is valid, and if it is,
    authenticates that user's 2FA column in postgres.
    :param user_name - Email address of the user who is going to be validated for 2FA
    :param otp_code - The one time password (otp) that they are attempting to verify
    :returns User object if queried successfully, null if not
    """
    user = Users.find_by_user_name(user_name=user_name)

    if user is None:
        logger.warning(
            f"User {user_name} attempted to verify account, but no account associated with that username."
        )
        raise GraphQLError(error_user_does_not_exist())

    valid_code = pyotp.totp.TOTP(os.getenv("BASE32_SECRET")).verify(otp_code)

    if valid_code is True:
        user.tfa_validated = True
        try:
            db_session.commit()
            logger.info(f"User: {user.id} successfully tfa validated their account.")
            return user
        except Exception as e:
            db_session.rollback()
            db_session.flush()
            logger.error(
                f"User: {user.id} attempted to tfa validate their account but a db error occurred: {str(e)}"
            )
            raise GraphQLError(error_user_not_updated())

    else:
        logger.warning(
            f"User: {user.id} attempted to tfa validate their account but their otp code was incorrect."
        )
        raise GraphQLError(error_otp_code_is_invalid())
