"""
This file enables a simple to manage way of defining permissions based on user roles.
Update the lists to define roles at each permission level
TODO: Improve how roles interact with one another across levels of permission
"""

super_admin_roles = ['super_admin']

# All actions accessible to an admin are accessible to a super admin.
admin_roles = ['admin', super_admin_roles]

# All actions accessible to users are accessible to any admin or super admin.
user_roles = ['user', admin_roles]


def is_super_admin(user_role):
    """
    :param user_role:
    :return: Returns true or false based on if this user is the given role
    """
    return user_role in super_admin_roles


def is_admin(user_role):
    """
    :param user_role:
    :return: Returns true or false based on if this user is the given role
    """
    return user_role in admin_roles


def is_user(user_role):
    """
    :param user_role:
    :return: Returns true or false based on if this user is the given role
    """
    return user_role in user_roles
