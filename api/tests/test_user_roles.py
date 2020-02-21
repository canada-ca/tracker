from flask_bcrypt import Bcrypt

from user_roles import (is_super_admin, is_admin, is_user)
import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
from graphene.test import Client
from flask_bcrypt import Bcrypt

import pytest

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from db import db
from app import app
from queries import schema
from models import Users
from functions.error_messages import error_not_an_admin
remove_seed()


@pytest.fixture(scope='class')
def user_role_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users (
            display_name="testuser",
            user_name="testuser@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_user)
        test_admin = Users(
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
            user_role='admin'
        )
        db.session.add(test_admin)
        db.session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('user_role_test_db_init')
class TestUserRole:
    def test_default_role(self):
        with app.app_context():
            # Get the user that was created in pyfixture.  Test default role
            user = Users.query.filter(Users.user_name == "testuser@testemail.ca").first()

            assert user.user_role == "user"
            assert not user.user_role == "admin"

    def test_update_role(self):
        with app.app_context():
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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

    def test_user_not_admin(self):
        with app.app_context():
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuser@testemail.ca", password:"testpassword123"){
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
