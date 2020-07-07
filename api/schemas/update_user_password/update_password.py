from graphql import GraphQLError

from app import logger
from db import db_session
from functions.input_validators import is_strong_password
from functions.error_messages import *
from models import Users


def update_password(
    user: Users, password: str, confirm_password: str, password_reset_code: int
) -> bool:
    """
    This function allows a user's password to be updated / reset.
    :param user: The user who requested a password change
    :param password: The new password to be set.
    :param confirm_password: A confirmation of the new password -- must be identical to password
    :param password_reset_code: A code found in the users row of the db, used to
    "cancel" the jwt if the reset is tried again
    :return user: Returns the freshly updated user object retrieved from the database
    """

    # Check to make sure password meets GoC requirements
    if not is_strong_password(password):
        logger.warning(
            f"User: {user.id} attempted to update password, but requirements were not met."
        )
        raise GraphQLError(error_password_does_not_meet_requirements())

    # Check to ensure that both passwords match
    if password != confirm_password:
        logger.warning(
            f"User: {user.id} attempted to update password, but passwords did not match."
        )
        raise GraphQLError(error_passwords_do_not_match())

    # Check to ensure that password reset code's match
    if user.password_reset_code != password_reset_code:
        logger.warning(
            f"User: {user.id} attempted to reset password, but the password reset code did not match."
        )
        raise GraphQLError("Error, please trying resetting password again.")

    # Update the users password, and reset the password code
    try:
        user.update_password(password=password)
        user.clear_password_code()

        db_session.commit()
        user = Users.find_by_id(user.id)
        logger.info(f"User: {user.id} successfully updated their password.")
        return True
    except Exception as e:
        db_session.rollback()
        db_session.flush()
        logger.error(
            f"A database exception occurred when a user: {user.id} tried to update their password: {str(e)}"
        )
        raise GraphQLError("Error when updating password, please try again.")
