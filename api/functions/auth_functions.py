from sqlalchemy.orm import load_only
from functions.orm_to_dict import orm_to_dict
from models import Organizations, User_affiliations
from manage import app


def is_super_admin(user_role):
    """
    :param user_role: list of dicts containing user roles
    :return: Returns true or false based on if this user is the given role
    """
    user_id = user_role[0]['user_id']
    with app.app_context():
        user_is_super_admin = User_affiliations.query \
            .filter(User_affiliations.user_id == user_id) \
            .filter(User_affiliations.permission == 'super_admin') \
            .first()
    if user_is_super_admin:
        return True
    return False


def is_admin(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        org_id = Organizations.query\
            .filter(Organizations.organization == org) \
            .options(load_only('id'))
        org_id = orm_to_dict(org_id)[0]['id']
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'admin':
            return True
    return False


def is_user_write(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        org_id = Organizations.query \
            .filter(Organizations.organization == org) \
            .options(load_only('id'))
        org_id = orm_to_dict(org_id)[0]['id']
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'user_write':
            return True
    return False


def is_user_read(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        org_id = Organizations.query\
            .filter(Organizations.organization == org)\
            .options(load_only('id'))
        org_id = orm_to_dict(org_id)[0]['id']
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'user_read':
            return True
    return False
