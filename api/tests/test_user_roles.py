import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
from graphene.test import Client
from flask_bcrypt import Bcrypt
from flask import Request
from werkzeug.test import create_environ

import pytest
from unittest import TestCase

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from db import db
from app import app
from queries import schema
from models import Users, User_affiliations, Organizations
from functions.error_messages import error_not_an_admin
from functions.auth_functions import (
    is_super_admin,
    is_admin,
    is_user_write,
    is_user_read
)
remove_seed()


@pytest.fixture(scope='class')
def user_role_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuser",
            user_name="testuser@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_user)
        test_admin = Users(
            id=2,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_admin)
        test_super_admin = Users(
            id=3,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_super_admin)
        test_org = Organizations(
            id=1,
            organization='ORG1',
            description='Organization 1',
        )
        db.session.add(test_org)
        test_admin_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2,
            organization_id=1,
            permission='admin'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=3,
            organization_id=1,
            permission='super_admin'
        )
        db.session.add(test_admin_role)
        db.session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('user_role_test_db_init')
class TestUserRole(TestCase):
    def test_update_role(self):
        with app.app_context():
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''')
            assert get_token['data']['signIn']['authToken'] is not None
            token = get_token['data']['signIn']['authToken']
            assert token is not None

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    testUserClaims(org: ORG1)
                }
                ''', context_value=request_headers)
            assert executed['data']
            assert executed['data']['testUserClaims']
            assert executed['data']['testUserClaims'] == "Passed"

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

            environ = create_environ()
            environ.update(
                HTTP_AUTHORIZATION=token
            )
            request_headers = Request(environ)

            executed = client.execute(
                '''
                {
                    testUserClaims(org: ORG1)
                }
                ''', context_value=request_headers)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == error_not_an_admin()


@pytest.mark.usefixtures('user_role_test_db_init')
class TestAuthFunction:
    def test_valid_super_admin(self):
        user_role = [{'user_id': 3, 'org_id': 1, 'permission': 'super_admin'}]
        assert is_super_admin(user_role)

    def test_invalid_super_admin(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'admin'}]
        assert not is_super_admin(user_role)

    def test_valid_admin(self):
        user_role = [{'user_id': 2, 'org_id': 1, 'permission': 'admin'}]
        org = 'ORG1'
        assert is_admin(user_role, org)

    def test_invalid_admin(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_write'}]
        org = 'ORG1'
        assert not is_admin(user_role, org)

    def test_valid_user_write(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_write'}]
        org = 'ORG1'
        assert is_user_write(user_role, org)

    def test_invalid_user_write(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        org = 'ORG1'
        assert not is_user_write(user_role, org)

    def test_valid_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': 'user_read'}]
        org = 'ORG1'
        assert is_user_read(user_role, org)

    def test_invalid_user_read(self):
        user_role = [{'user_id': 1, 'org_id': 1, 'permission': ''}]
        org = 'ORG1'
        assert not is_user_read(user_role, org)
