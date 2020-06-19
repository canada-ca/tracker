import datetime
import bcrypt

from app import logger
from db import db_session
from functions.input_validators import *
from functions.error_messages import *
from graphql import GraphQLError
from json_web_token import tokenize
from models import Users


def sign_in_user(user_name, password):
    """
    This function will perform the sign in functionality and return an access token to be used in later requests.
    :param user_name: The email address of the user you hope to sign in.
    :param password: The password of the user you hope to sign in.
    :return temp_dict: A dictionary containing both the user object and the auth token
    """
    user_name = cleanse_input(user_name)
    password = cleanse_input(password)
    user = Users.find_by_user_name(user_name)

    if user is None:
        logger.warning(
            f"User attempted to authenticate an account that does not exist using this username: {user_name}."
        )
        raise GraphQLError(error_user_does_not_exist())

    # Checks the amount of failed login attempts and if the time since the last
    # Attempt was more than 30min (1800s)
    if (
        user.failed_login_attempts
        and (user.failed_login_attempt_time + 1800)
        < datetime.datetime.now().timestamp()
    ):
        logger.warning(
            f"User: {user.id} tried to authenticate but has too many login attempts."
        )
        raise GraphQLError(error_too_many_failed_login_attempts())

    email_match = user_name == user.user_name
    password_match = bcrypt.checkpw(
        password.encode("utf8"), user.password.encode("utf8")
    )

    # If the given user credentials are valid
    if email_match and password_match:

        user.failed_login_attempts = 0
        user.failed_login_attempt_time = 0
        try:
            db_session.add(user)
            db_session.commit()
            logger.info(f"Successfully reset user: {user.id} login attempts counter.")
        except Exception as e:
            db_session.rollback()
            db_session.flush()
            logger.error(
                f"A database exception occurred when a user: {user.id} tried to authenticate their account: {str(e)}"
            )
            raise GraphQLError("Error authenticating account, please try again.")

        logger.info(f"User: {user.id} successfully authenticated their account.")
        return {
            "auth_token": tokenize(user_id=user.id),
            "user": user,
        }

    else:
        # Increment the user's failed login count and raise an appropriate error
        # Generate a timestamp and also add that to the user update.
        time_stamp = datetime.datetime.now().timestamp()

        user.failed_login_attempts = user.failed_login_attempts + 1
        user.failed_login_attempt_time = time_stamp
        try:
            db_session.add(user)
            db_session.commit()
            logger.info(
                f"Successfully increased login failed attempts counter for user: {user.id}"
            )
        except Exception as e:
            db_session.rollback()
            db_session.flush()

            logger.error(
                f"A database exception occurred when a trying to increment a user: {user.id} failed login attempts: {str(e)}"
            )
            raise GraphQLError(str(e))

        logger.warning(
            f"User attempted to authenticate an account {user.id} with invalid credentials."
        )
        raise GraphQLError(error_invalid_credentials())
