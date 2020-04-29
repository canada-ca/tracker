import pytest
from app import app
from db import db_session
from models import Users, User_affiliations, Organizations
from functions.auth_functions import (
    is_super_admin,
    is_admin,
    is_user_write,
    is_user_read,
)

class TestAuthFunctions:
    def test_user_read_check_perm_user_read(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": "user_read"}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_user_write(self):
        user_role = [{"user_id": 2, "org_id": 1, "permission": "user_write"}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_user_admin(self):
        user_role = [{"user_id": 3, "org_id": 1, "permission": "admin"}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_perm_super_admin(self):
        user_role = [{"user_id": 4, "org_id": 1, "permission": "super_admin"}]
        org_id = 1
        assert is_user_read(user_role, org_id)

    def test_user_read_check_invalid(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": ""}]
        org_id = 1
        assert not is_user_read(user_role, org_id)

    def test_user_write_check_perm_user_read(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": "user_read"}]
        org_id = 1
        assert not is_user_write(user_role, org_id)

    def test_user_write_check_perm_user_write(self):
        user_role = [{"user_id": 2, "org_id": 1, "permission": "user_write"}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_perm_user_admin(self):
        user_role = [{"user_id": 3, "org_id": 1, "permission": "admin"}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_perm_super_admin(self):
        user_role = [{"user_id": 4, "org_id": 1, "permission": "super_admin"}]
        org_id = 1
        assert is_user_write(user_role, org_id)

    def test_user_write_check_invalid(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": ""}]
        org_id = 1
        assert not is_user_write(user_role, org_id)

    def test_admin_check_perm_user_read(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": "user_read"}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_admin_check_perm_user_write(self):
        user_role = [{"user_id": 2, "org_id": 1, "permission": "user_write"}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_admin_check_perm_user_admin(self):
        user_role = [{"user_id": 3, "org_id": 1, "permission": "admin"}]
        org_id = 1
        assert is_admin(user_role, org_id)

    def test_admin_check_perm_super_admin(self):
        user_role = [{"user_id": 4, "org_id": 1, "permission": "super_admin"}]
        org_id = 1
        assert is_admin(user_role, org_id)

    def test_admin_check_invalid(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": ""}]
        org_id = 1
        assert not is_admin(user_role, org_id)

    def test_super_admin_check_perm_user_read(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": "user_read"}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_user_write(self):
        user_role = [{"user_id": 2, "org_id": 1, "permission": "user_write"}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_user_admin(self):
        user_role = [{"user_id": 3, "org_id": 1, "permission": "admin"}]
        assert not is_super_admin(user_role)

    def test_super_admin_check_perm_super_admin(self):
        user_role = [{"user_id": 4, "org_id": 1, "permission": "super_admin"}]
        assert is_super_admin(user_role)

    def test_super_admin_check_invalid(self):
        user_role = [{"user_id": 1, "org_id": 1, "permission": ""}]
        assert not is_super_admin(user_role)
