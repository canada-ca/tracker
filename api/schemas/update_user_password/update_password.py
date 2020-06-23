import bcrypt

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.input_validators import *
from functions.error_messages import *
from models import Users


def update_password(user_name, password, confirm_password):
    """
    This function allows a user's password to be updated / reset.
    :param user_name: Email address associated with the account who's password is being updated
    :param password: The new password to be set.
    :param confirm_password: A confirmation of the new password -- must be identical to password
    :return user: Returns the freshly updated user object retrieved from the database
    """
    password = cleanse_input(password)
    confirm_password = cleanse_input(confirm_password)
    user_name = cleanse_input(user_name)

    user = Users.find_by_user_name(user_name)

    if user is None:
        logger.warning(
            f"User attempted to update password for {user_name}, but the account does not exist."
        )
        raise GraphQLError(error_user_does_not_exist())

    if not is_strong_password(password):
        logger.warning(
            f"User: {user.id} attempted to update password, but requirements were not met."
        )
        raise GraphQLError(error_password_does_not_meet_requirements())

    if password != confirm_password:
        logger.warning(
            f"User: {user.id} attempted to update password, but passwords did not match."
        )
        raise GraphQLError(error_passwords_do_not_match())

    user = db_session.query(Users).filter(Users.user_name == user_name).first()
    user.update_password(password=password)

    try:
        db_session.commit()
        user = Users.find_by_user_name(user_name)
        logger.info(f"User: {user.id} successfully updated their password.")
        return user
    except Exception as e:
        db_session.rollback()
        db_session.flush()
        logger.error(
            f"A database exception occurred when a user: {user.id} tried to update their password: {str(e)}"
        )
        raise GraphQLError(error_password_not_updated())
