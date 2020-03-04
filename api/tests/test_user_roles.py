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
from backend.security_check import SecurityAnalysisBackend
remove_seed()


@pytest.fixture(scope='class')
def user_role_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_user)
        test_super_admin = Users(
            id=2,
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
            permission='user_read'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2,
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
class TestUserUpdateWriteRole(TestCase):
    def test_user_claim_update_to_user_write(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                mutation{
                    updateUserRole(org: ORG1, role: USER_WRITE, userName:"testuserread@testemail.ca"){
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['updateUserRole']
            assert executed['data']['updateUserRole']['status'] == 'Update Successful'

            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                    testUserClaims(org: ORG1, role: USER_WRITE)
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['testUserClaims']
            assert executed['data']['testUserClaims'] == 'User Passed User Write Claim'


@pytest.mark.usefixtures('user_role_test_db_init')
class TestUserUpdateAdminRole(TestCase):
    def test_user_claim_update_to_admin(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                mutation{
                    updateUserRole(org: ORG1, role: ADMIN, userName:"testuserread@testemail.ca"){
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['updateUserRole']
            assert executed['data']['updateUserRole']['status'] == 'Update Successful'

            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                    testUserClaims(org: ORG1, role: ADMIN)
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['testUserClaims']
            assert executed['data']['testUserClaims'] == 'User Passed Admin Claim'


@pytest.mark.usefixtures('user_role_test_db_init')
class TestUserUpdateSuperAdminRole(TestCase):
    def test_user_claim_update_to_super_admin(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                mutation{
                    updateUserRole(org: ORG1, role: SUPER_ADMIN, userName:"testuserread@testemail.ca"){
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['updateUserRole']
            assert executed['data']['updateUserRole']['status'] == 'Update Successful'

            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                    testUserClaims(org: ORG1, role: SUPER_ADMIN)
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['data']
            assert executed['data']['testUserClaims']
            assert executed['data']['testUserClaims'] == 'User Passed Super Admin Claim'


@pytest.mark.usefixtures('user_role_test_db_init')
class TestUserUpdateAdminRoleInvalid(TestCase):
    def test_user_claim_update_to_user_write(self):
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                ''', backend=backend)
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
                mutation{
                    updateUserRole(org: ORG1, role: ADMIN, userName:"testsuperadmin@testemail.ca"){
                        status
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == error_not_an_admin()
