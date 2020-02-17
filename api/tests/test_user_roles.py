from flask_bcrypt import Bcrypt

from user_roles import (is_super_admin, is_admin, is_user)
import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
from graphene.test import Client
from functions.error_messages import error_not_an_admin


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


@pytest.fixture()
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

            # Insert an admin into DB
            test_admin = User(
                username="testadmin",
                user_email="testadmin@testemail.ca",
                user_password=bcrypt.generate_password_hash(password="testpassword123").decode("UTF-8"),
                user_role='admin'
            )
            db.session.add(test_admin)
            db.session.commit()

        yield

        # Delete all users after testing
        with app.app_context():
            User.query.delete()


class TestUserRole:
    def test_default_role(self, setup_empty_db_with_user):
        # Get the user that was created in pyfixture.
        user = User.query.first()

        assert user.user_role == "user"
        assert not user.user_role == "admin"

    def test_update_role(self, setup_empty_db_with_user):
        client = Client(schema)
        get_token = client.execute(
            '''
            mutation{
                signIn(email:"testadmin@testemail.ca", password:"testpassword123"){
                    authToken
                }
            }
            ''')
        assert get_token['data']['signIn']['authToken'] is not None
        token = get_token['data']['signIn']['authToken']
        assert token is not None

        executed = client.execute(
            '''
            {
                testUserClaims(token:"''' + str(token) + '''")
            }
            ''')
        assert executed['data']
        assert executed['data']['testUserClaims']
        assert executed['data']['testUserClaims'] == "{'roles': 'admin'}"

    def test_user_not_admin(self, setup_empty_db_with_user):
        client = Client(schema)
        get_token = client.execute(
            '''
            mutation{
                signIn(email:"testuser@testemail.ca", password:"testpassword123"){
                    authToken
                }
            }
            ''')
        assert get_token['data']['signIn']['authToken'] is not None
        token = get_token['data']['signIn']['authToken']
        assert token is not None

        executed = client.execute(
            '''
            {
                testUserClaims(token:"''' + str(token) + '''")
            }
            ''')
        assert executed['data']
        assert executed['data']['testUserClaims']
        assert executed['data']['testUserClaims'] == error_not_an_admin()


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
