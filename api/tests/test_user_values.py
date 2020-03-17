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
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
            preferred_lang="English",
            tfa_validated=False
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


@pytest.mark.usefixtures('org_perm_test_db_init')
class TestOrgResolverWithOrgsAndValues(TestCase):
    # Super Admin Tests
    def test_get_another_users_information(self):
        """
        Test to see if an admin can select another users information
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
                        userName
                        displayName
                        lang
                        tfa
                        affiliations {
                            edges {
                                node {
                                    userId
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "user": [
                        {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "lang": "English",
                            "tfa": False,
                            "affiliations": {
                                "edges": [
                                    {
                                        "node": {
                                            "userId": 1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_another_users_information_user_does_not_exist(self):
        """
        Test to see that error message appears when user does not exist
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
                    user(userName: "IdontThinkSo@testemail.ca") {
                        userName
                        displayName
                        lang
                        tfa
                        affiliations {
                            edges {
                                node {
                                    userId
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message'] == "Error, user cannot be " \
                                                       "found"

    # User read tests
    def test_get_own_user_information(self):
        """
        Test to see if user can access all user object values
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
                    user {
                        userName
                        displayName
                        lang
                        tfa
                        affiliations {
                            edges {
                                node {
                                    userId
                                }
                            }
                        }
                    }
                }
                ''', context_value=request_headers, backend=backend)
            result_refr = {
                "data": {
                    "user": [
                        {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "lang": "English",
                            "tfa": False,
                            "affiliations": {
                                "edges": [
                                    {
                                        "node": {
                                            "userId": 1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)
