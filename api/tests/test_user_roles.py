from flask_bcrypt import Bcrypt

from ..user_roles import *
import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db import *
from app import app
from queries import schema

from models import Users as User


@pytest.fixture()
def setup_db():
    db.init_app(app)


@pytest.fixture(scope='class')
def setup_empty_db_with_user():
    db.init_app(app)
    with app.app_context():
        bcrypt = Bcrypt(app)

        if User.query.first() is None:
            # Insert a user into DB
            test_user = User(
                username="testuser",
                user_email="testuser@testemail.ca",
                user_password=bcrypt.generate_password_hash(password="testpassword123").decode("UTF-8"),

            )
            db.session.add(test_user)
            db.session.commit()

        yield

        # Delete all users after testing
        with app.app_context():
            User.query.delete()


class TestUserClaims:
    def test_default_role_user_claims(self, setup_empty_db_with_user):
        user = User.query.first()

        assert user.user_role == "user"
        assert not user.user_role == "admin"


class TestSuperAdminFunction:

    def test_valid_super_admin(self):
        user_role = "super_admin"
        assert is_super_admin(user_role)

    def test_invalid_super_admin(self):
        user_role = "admin"
        assert not is_super_admin(user_role)


class TestAdminFunction:

    def test_valid_super_admin(self):
        user_role = "super_admin"
        assert is_admin(user_role)

    def test_valid_admin(self):
        user_role = "admin"
        assert is_admin(user_role)

    def test_invalid_admin(self):
        user_role = "user"
        assert not is_admin(user_role)


class TestUserFunction:

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
