import bcrypt
from graphql import GraphQLError

from functions.input_validators import *
from functions.error_messages import *
from models import Users as User
from db import db_session


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

    if not is_strong_password(password):
        raise GraphQLError(error_password_does_not_meet_requirements())

    if password != confirm_password:
        raise GraphQLError(error_passwords_do_not_match())

    user = User.find_by_user_name(user_name)

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    # TODO: move this into the user model
    user = User.query.filter(User.user_name == user_name).update(
        {
            "user_password": bcrypt.hashpw(
                password.encode("utf8"), bcrypt.gensalt()
            ).decode("utf8"),
            "failed_login_attempts": 0,
            "failed_login_attempt_time": 0,
        }
    )

    db_session.commit()

    if not user:
        raise GraphQLError(error_password_not_updated())
    else:
        # Re-query the user to ensure the latest object is returned
        user = User.find_by_user_name(user_name)
        return user
