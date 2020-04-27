import pytest
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import db_session
from models import Organizations, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend


@pytest.fixture(scope="class")
def user_resolver_test_db_init():

    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
            preferred_lang="English",
            tfa_validated=False,
        )
        db_session.add(test_user)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_super_admin)

        org = Organizations(id=1, acronym="ORG1")
        db_session.add(org)
        org = Organizations(id=2, acronym="ORG2")
        db_session.add(org)
        org = Organizations(id=3, acronym="ORG3")
        db_session.add(org)

        test_admin_role = User_affiliations(
            user_id=1, organization_id=1, permission="user_read"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=2, organization_id=1, permission="super_admin"
        )
        db_session.add(test_admin_role)

        db_session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures("user_resolver_test_db_init")
class TestUserResolverValues(TestCase):
    # Super Admin Tests
    def test_get_another_users_information(self):
        """
        Test to see if an admin can select another users information
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
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
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {
                    "user": [
                        {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "lang": "English",
                            "tfa": False,
                            "affiliations": {"edges": [{"node": {"userId": 1}}]},
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
                """
                mutation{
                    signIn(userName:"testsuperadmin@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
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
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == "Error, user cannot be " "found"

    # User read tests
    def test_get_own_user_information(self):
        """
        Test to see if user can access all user object values
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserread@testemail.ca", password:"testpassword123"){
                        authToken
                    }
                }
                """,
                backend=backend,
            )
            assert get_token["data"]["signIn"]["authToken"] is not None
            token = get_token["data"]["signIn"]["authToken"]
            assert token is not None

            environ = create_environ()
            environ.update(HTTP_AUTHORIZATION=token)
            request_headers = Request(environ)

            executed = client.execute(
                """
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
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {
                    "user": [
                        {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "lang": "English",
                            "tfa": False,
                            "affiliations": {"edges": [{"node": {"userId": 1}}]},
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)
