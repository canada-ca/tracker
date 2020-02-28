import jwt
import datetime
import os
from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app
from sqlalchemy.orm import load_only

from functions.input_validators import *
from functions.error_messages import *
from functions.orm_to_dict import orm_to_dict

from models import Users
from models import User_affiliations
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
    user = Users.query.filter(Users.user_name == user_name).first()

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    if user.failed_login_attempts >= 5:
        raise GraphQLError(error_too_many_failed_login_attempts())

    bcrypt = Bcrypt(app)  # Create the bcrypt object that will handle password hashing and verification

    email_match = user_name == user.user_name
    password_match = bcrypt.check_password_hash(user.user_password, password)

    # If the given user credentials are valid
    if email_match and password_match:
        # Fetch user's role from the database and include it as claims on the JWT being generated
        user_aff = User_affiliations.query.filter(User_affiliations.user_id == user.id).all()
        user_aff = orm_to_dict(user_aff)
        if len(user_aff):
            user_roles = []
            for select in user_aff:
                temp_dict = {
                    'user_id': select['user_id'],
                    'org_id': select['organization_id'],
                    'permission': select['permission']
                }
                user_roles.append(temp_dict)
        else:
            user_roles = 'none'
        try:
            payload = {
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=1800),
                'iat': datetime.datetime.utcnow(),
                "roles": user_roles
            }
            token = jwt.encode(
                payload,
                str(os.getenv('SUPER_SECRET_SALT')),
                algorithm='HS256'
            ).decode('utf-8')
        except Exception as e:
            raise GraphQLError('Token Generation Error: ' + str(e))

        # A temporary dictionary that will be returned to the graphql resolver
        temp_dict = {
            'auth_token': token,
            'user': user
        }

        Users.query.filter(Users.user_name == user_name).update({'failed_login_attempts': 0})
        db.session.commit()

        return temp_dict
    else:

        Users.query.filter(Users.user_name == user_name)\
            .update({'failed_login_attempts': Users.failed_login_attempts + 1})
        db.session.commit()

        raise GraphQLError(error_invalid_credentials())
