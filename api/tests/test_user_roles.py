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


class TestUserRole:
    def test_default_role(self):
        with app.app_context():
            # Get the user that was created in pyfixture.  Test default role
            user = User.query.filter(User.user_email == "testuser@testemail.ca").first()

            assert user.user_role == "user"
            assert not user.user_role == "admin"

    def test_update_role(self):
        with app.app_context():
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

    def test_user_not_admin(self):
        with app.app_context():
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
