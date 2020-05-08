import pytest
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend

save, cleanup, session = DB()


@pytest.fixture(scope="class")
def user_resolver_test_db_init():

    with app.app_context():
        org1 = Organizations(acronym="ORG1")

        test_user = Users(
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
            preferred_lang="English",
            tfa_validated=False,
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="user_read")
            ],
        )
        save(test_user)
        session.add(test_user)
        test_super_admin = Users(
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="super_admin")
            ],
        )
        save(test_super_admin)

        yield
        cleanup()


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

            results = client.execute(
                """
                {
                    user(userName: "testuserread@testemail.ca") {
                        userName
                        displayName
                        lang
                        tfa
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            expected = {
                "data": {
                    "user": [
                        {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "lang": "English",
                            "tfa": False,
                        }
                    ]
                }
            }
            self.assertDictEqual(expected, results)

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
                        }
                    ]
                }
            }
            self.assertDictEqual(result_refr, executed)
