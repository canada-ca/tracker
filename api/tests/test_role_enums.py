import pytest

from enums.roles import RoleEnums


def test_super_admin_enum():
    assert RoleEnums.SUPER_ADMIN == "super_admin"
    assert RoleEnums.SUPER_ADMIN == RoleEnums.get("super_admin")


def test_admin_enum():
    assert RoleEnums.ADMIN == "admin"
    assert RoleEnums.ADMIN == RoleEnums.get("admin")


def test_user_write_enum():
    assert RoleEnums.USER_WRITE == "user_write"
    assert RoleEnums.USER_WRITE == RoleEnums.get("user_write")


def test_user_read_enum():
    assert RoleEnums.USER_READ == "user_read"
    assert RoleEnums.USER_READ == RoleEnums.get("user_read")
