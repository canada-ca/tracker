from functions.error_messages import *
from db import db
from models import Users as User
from graphql import GraphQLError
from user_roles import *

from flask_graphql_auth import *


def update_user_role(email, new_role):
    """
    Updates the user role associate with the user given by email address
    :param email: The email address associated with the user who's role will be updated.
    :param new_role: The new role that will be given to the user.
    :returns user: The newly updated user object retrieved from the DB (after the update is committed).
    """
    user = User.query.filter(User.user_email == email).first()

    if user is None:
        # State that no such user exists using that email address
        raise GraphQLError(error_user_does_not_exist())

    role = get_jwt_claims()['roles']  # Pulls the 'role' out of the JWT user claims associated with the token.

    if is_admin(role):  # If an admin, update the user.
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
