from functions.error_messages import *
from db import db
from models import Users as User
from graphql import GraphQLError

from flask_graphql_auth import *


def update_user_role(email, new_role):
    """Updates the user role associate with the user given by email address"""
    user = User.query.filter(User.user_email == email).first()

    if user is None:
        raise GraphQLError(error_user_does_not_exist())

    role = get_jwt_claims()['roles']

    if role == "admin":
        user = User.query.filter(User.user_email == email)\
                .update({'user_role': new_role})
        db.session.commit()
    else:
        raise GraphQLError(error_not_an_admin())

    if not user:
        raise GraphQLError(error_role_not_updated())
    else:
        user = User.query.filter(User.user_email == email).first()
        return user
