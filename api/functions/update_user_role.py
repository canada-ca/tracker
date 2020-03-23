from graphql import GraphQLError
from sqlalchemy.orm import load_only

from functions.auth_functions import is_admin, is_super_admin
from functions.error_messages import (error_user_does_not_exist, error_not_an_admin, error_role_not_updated)
from functions.orm_to_dict import orm_to_dict
from db import db
from app import app
from models import Users as User
from models import Organizations as Orgs
from models import User_affiliations as User_aff


def update_user_role(**kwargs):
    """
    Updates the user role associate with the user given by email address
    :param user_name: The email address associated with the user who's role will be updated.
    :param org: The organization that the users permissions will be edited to
    :param new_role: The new role that will be given to the user.
    :returns user: The newly updated user object retrieved from the DB (after the update is committed).
    """
    user_name = kwargs.get('user_name')
    org = kwargs.get('org')
    new_role = kwargs.get('role')
    user_roles = kwargs.get('user_roles')
    user_id = kwargs.get('user_id')

    with app.app_context():
        user = User.query.filter(User.user_name == user_name).all()
        user = orm_to_dict(user)

        org_orm = Orgs.query.filter(Orgs.acronym == org).first()
        org_id = org_orm.id

    if user is None:
        # State that no such user exists using that email address
        raise GraphQLError(error_user_does_not_exist())

    def update_user_role_db():
        with app.app_context():
            User_aff.query \
                .filter(User_aff.organization_id == org_id) \
                .filter(User_aff.user_id == user[0]['id']) \
                .update({'permission': new_role})
            db.session.commit()

    if new_role == 'admin' or new_role == 'super_admin':
        if is_super_admin(user_id):
            update_user_role_db()
        else:
            raise GraphQLError(error_not_an_admin())

    elif new_role == 'user_read' or new_role == 'user_write':
        if is_admin(user_roles, org_id):
            update_user_role_db()
        else:
            raise GraphQLError(error_not_an_admin())
