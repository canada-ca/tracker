admin_roles = ["admin"]


def is_admin(user_role):
    return user_role in admin_roles
