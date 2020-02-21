from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app
from flask_graphql_auth import create_access_token

from functions.input_validators import *
from functions.error_messages import *

from models import Users as User
from db import db


def sign_in_user(user_name, password):
    """
    This function will perform the sign in functionality and return an access token to be used in later requests.
    :param email: The email address of the user you hope to sign in.
    :param password: The password of the user you hope to sign in.
    :return temp_dict: A dictionary containing both the user object and the auth token
    """
    user_name = cleanse_input(user_name)
    password = cleanse_input(password)
    user = User.query.filter(User.user_name == user_name).first()

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    bcrypt = Bcrypt(app)  # Create the bcrypt object that will handle password hashing and verification

    email_match = user_name == user.user_name
    password_match = bcrypt.check_password_hash(user.user_password, password)

    # If the given user credentials are valid
    if email_match and password_match:
        # Fetch user's role from the database and include it as claims on the JWT being generated
        user_claims = {"roles": user.user_role}

        # A temporary dictionary that will be returned to the graphql resolver
        temp_dict = {
            'auth_token': create_access_token(user.id, user_claims=user_claims),
            'user': user
        }

        return temp_dict
    else:
        raise GraphQLError(error_invalid_credentials())
