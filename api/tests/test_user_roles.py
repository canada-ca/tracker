from ..user_roles import *


class TestSuperAdmin:

    def test_valid_super_admin(self):
        user_role = "super_admin"
        assert is_super_admin(user_role)

    def test_invalid_super_admin(self):
        user_role = "admin"
        assert not is_super_admin(user_role)


class TestAdmin:

    def test_valid_super_admin(self):
        user_role = "super_admin"
        assert is_admin(user_role)

    def test_valid_admin(self):
        user_role = "admin"
        assert is_admin(user_role)

    def test_invalid_admin(self):
        user_role = "user"
        assert not is_admin(user_role)


class TestUser:

    def test_valid_super_admin(self):
        user_role = "super_admin"
        assert is_user(user_role)

    def test_valid_admin(self):
        user_role = "admin"
        assert is_user(user_role)

    def test_valid_user(self):
        user_role = "user"
        assert is_user(user_role)

    def test_invalid_role(self):
        user_role = "not-a-real-role"
        assert not is_user(user_role)
