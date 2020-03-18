import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from flask import Request
from graphene.test import Client
from flask_bcrypt import Bcrypt

from unittest import TestCase

from werkzeug.test import create_environ

from manage import seed, remove_seed

seed()
from app import app
from db import db
from models import Organizations, Domains, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend
remove_seed()

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))


@pytest.fixture(scope='class')
def org_perm_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_read = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
        )
        db.session.add(test_read)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_super_admin)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_admin)
        test_admin = Users(
            id=4,
            display_name="testadmin2",
            user_name="testadmin2@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_admin)
        test_write = Users(
            id=5,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8")
        )
        db.session.add(test_write)

        org = Organizations(
            id=1,
            acronym='ORG1'
        )
        db.session.add(org)
        org = Organizations(
            id=2,
            acronym='ORG2'
        )
        db.session.add(org)
        org = Organizations(
            id=3,
            acronym='ORG3'
        )
        db.session.add(org)

        test_user_read_role = User_affiliations(
            user_id=1,
            organization_id=1,
            permission='user_read'
        )
        db.session.add(test_user_read_role)
        test_super_admin_role = User_affiliations(
            user_id=2,
            organization_id=2,
            permission='super_admin'
        )
        db.session.add(test_super_admin_role)
        test_admin_role = User_affiliations(
            user_id=3,
            organization_id=1,
            permission='admin'
        )
        db.session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4,
            organization_id=2,
            permission='admin'
        )
        db.session.add(test_admin_role)
        test_user_write_role = User_affiliations(
            user_id=5,
            organization_id=1,
            permission='user_write'
        )
        db.session.add(test_user_write_role)
        db.session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db.session.commit()


@pytest.mark.usefixtures('org_perm_test_db_init')
class TestOrgResolverWithOrgsAndValues(TestCase):
    # Super Admin Tests
    def test_get_user_as_super_admin(self):
        """
        Test to see if user resolver access control allows super admin to
        request users inside and outside of their organization
        """
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
                {
                    user(userName: "testuserread@testemail.ca") {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "user": [
                        {
                            "displayName": "testuserread"
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)

    # Admin Same Org
    def test_get_user_from_same_org(self):
        """
        Test to see if user resolver access control allows admin to
        request users inside and not outside of their organization
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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
                    user(userName: "testuserread@testemail.ca") {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "user": [
                        {
                            "displayName": "testuserread"
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)

    # Admin different org
    def test_get_user_admin_from_different_org(self):
        """
        Test to see if user resolver access control does not  allow  admin
        from another organization to select them
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
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
                    user(userName: "testuserread@testemail.ca") {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, user does not " \
                                                       "belong to any of your" \
                                                       " organizations"

    # User write tests
    def test_get_user_user_write(self):
        """
        Test to see if user resolver access control to ensure users with user
        write access cannot access this query
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                '''
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
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
                    user(userName: "testuserread@testemail.ca") {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to view this users information"

    # User read tests
    def test_get_user_user_read(self):
        """
        Test to see if user resolver access control to ensure users with user
        write access cannot access this query
        """
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
                {
                    user(userName: "testuserread@testemail.ca") {
                        displayName
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, you do not have permission to view this users information"
