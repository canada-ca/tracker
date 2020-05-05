from app import app


def is_super_admin(user_roles):
    """
    :param user_roles: users roles
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        for role in user_roles:
            if role['permission'] == "super_admin":
                return True
    return False


def is_admin(user_roles, org_id):
    """
    :param user_roles: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    admin_perms = ['super_admin', 'admin']
    with app.app_context():
        for role in user_roles:
            if (
                role['org_id'] == org_id and
                role['permission'] in admin_perms
            ) or role['permission'] == 'super_admin':
                return True
    return False


def is_user_write(user_roles, org_id):
    """
    :param user_roles: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    user_write_perms = ['super_admin', 'admin', 'user_write']
    with app.app_context():
        for role in user_roles:
            if (
                role['org_id'] == org_id and
                role['permission'] in user_write_perms
            ) or role['permission'] == 'super_admin':
                return True
    return False


def is_user_read(user_roles, org_id):
    """
    :param user_roles: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    user_read_perms = ['super_admin', 'admin', 'user_write', 'user_read']
    with app.app_context():
        for role in user_roles:
            if (
                role['org_id'] == org_id and
                role['permission'] in user_read_perms
            ) or role['permission'] == 'super_admin':
                return True
    return False
