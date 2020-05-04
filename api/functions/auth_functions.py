from sqlalchemy.orm import load_only
from functions.orm_to_dict import orm_to_dict
from models import Organizations, User_affiliations
from app import app

admin_perms = ["super_admin", "admin"]
user_write_perms = ["super_admin", "admin", "user_write"]
user_read_perms = ["super_admin", "admin", "user_write", "user_read"]


def is_super_admin(user_role):
    """
    :param user_role: users roles
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        for role in user_role:
            if role["permission"] == "super_admin":
                return True
    return False


def is_admin(user_role, org_id):
    """
    :param user_role: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        for role in user_role:
            if (role["org_id"] == org_id and role["permission"] in admin_perms) or role[
                "permission"
            ] == "super_admin":
                return True
    return False


def is_user_write(user_role, org_id):
    """
    :param user_role: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        for role in user_role:
            if (
                role["org_id"] == org_id and role["permission"] in user_write_perms
            ) or role["permission"] == "super_admin":
                return True
    return False


def is_user_read(user_role, org_id):
    """
    :param user_role: dict of user roles
    :param org_id: Org id used to validate claims
    :return: Returns true or false based on if this user is the given role
    """
    with app.app_context():
        for role in user_role:
            if (
                role["org_id"] == org_id and role["permission"] in user_read_perms
            ) or role["permission"] == "super_admin":
                return True
    return False
