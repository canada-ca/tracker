import datetime

from graphql import GraphQLError
from flask_bcrypt import Bcrypt

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from app import app
from db import db


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

    user = User.query.filter(User.user_name == user_name).first()

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    bcrypt = Bcrypt(app)  # Create the bcrypt object that will handle password hashing and verification

    user = User.query.filter(User.user_name == user_name) \
        .update({
            'user_password': bcrypt.generate_password_hash(password).decode('UTF-8'),
            'failed_login_attempts': 0,
            'failed_login_attempt_time': 0
        })

    db.session.commit()

    if not user:
        raise GraphQLError(error_password_not_updated())
    else:
        # Re-query the user to ensure the latest object is returned
        user = User.query.filter(User.user_name == user_name).first()
        return user
