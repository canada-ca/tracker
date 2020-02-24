from sqlalchemy.orm import load_only
from functions.orm_to_dict import orm_to_dict
from models import Organizations
"""
This file enables a simple to manage way of defining permissions based on user roles.
Update the lists to define roles at each permission level
TODO: Improve how roles interact with one another across levels of permission
"""

# super_admin_roles = ['super_admin']
#
# # All actions accessible to an admin are accessible to a super admin.
# admin_roles = ['admin']
# admin_roles.extend(super_admin_roles)
#
# # All actions accessible to users are accessible to any admin or super admin.
# user_roles = ['user']
# user_roles.extend(admin_roles)


def is_super_admin(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    org_id = Organizations.query\
        .filter(Organizations.organization == org)\
        .options(load_only('id'))\
        .all()
    org_id = orm_to_dict(org_id)[0]['id']
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'super_admin':
            return True
    return False


def is_admin(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    org_id = Organizations.query\
        .filter(Organizations.organization == org)\
        .options(load_only('id'))
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'admin':
            return True
    return False


def is_user(user_role, org):
    """
    :param user_role: dict of user roles
    :param org: Org enum used to find org id
    :return: Returns true or false based on if this user is the given role
    """
    org_id = Organizations.query\
        .filter(Organizations.organization == org)\
        .options(load_only('id'))
    for role in user_role:
        if role['org_id'] == org_id and role['permission'] == 'user':
            return True
    return False
