from graphql import GraphQLError
from sqlalchemy.orm import load_only

from user_roles import is_admin, is_super_admin
from functions.error_messages import (error_user_does_not_exist, error_not_an_admin, error_role_not_updated)
from functions.orm_to_dict import orm_to_dict
from db import db
from models import Users as User
from models import Organizations
from models import User_affiliations


def update_user_role(user_name, org, new_role):
    """
    Updates the user role associate with the user given by email address
    :param user_name: The email address associated with the user who's role will be updated.
    :param org: The organization that the users permissions will be edited to
    :param new_role: The new role that will be given to the user.
    :returns user: The newly updated user object retrieved from the DB (after the update is committed).
    """
    user = User.query.filter(User.user_name == user_name).first()

    if user is None:
        # State that no such user exists using that email address
        raise GraphQLError(error_user_does_not_exist())

    # roles = get_jwt_claims()['roles']  # Pulls the 'role' out of the JWT user claims associated with the token.

    def update_role(user, new_role, org):
        org_id = Organizations.query.filter(Organizations.organization == org)\
            .options(load_only('id'))\
            .all()
        org_id = orm_to_dict(org_id)[0]['id']
        User_affiliations.query\
            .filter(User_affiliations.user_id == user.id)\
            .filter(User_affiliations.organization_id == org_id)\
            .update({'permission': new_role})
        return db.session.commit()

    if is_admin(roles, org) and (new_role == 'user'):  # If an admin, update the user.
        update_role(user, new_role, org)
    elif is_super_admin(roles, org) and (new_role == 'user' or
                                         new_role == 'admin' or
                                         new_role == 'super_admin'):
        update_role(user, new_role, org)
    else:
        raise GraphQLError(error_not_an_admin())

    if not user:
        raise GraphQLError(error_role_not_updated())
    else:
        user = User.query.filter(User.user_name == user_name).first()
        return user
