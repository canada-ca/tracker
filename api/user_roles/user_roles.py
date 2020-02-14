from .admin_roles import admin_roles

user_roles = ['user', admin_roles]


def is_user(user_role):
    return user_role in user_roles