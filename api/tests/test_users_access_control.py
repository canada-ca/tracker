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
def users_resolver_test_db_init():
    with app.app_context():
        test_read = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_read)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_super_admin)
        test_admin = Users(
            id=3,
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_admin)
        test_admin = Users(
            id=4,
            display_name="testadmin2",
            user_name="testadmin2@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_admin)
        test_write = Users(
            id=5,
            display_name="testuserwrite",
            user_name="testuserwrite@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_write)

        org = Organizations(id=1, acronym="ORG1")
        db_session.add(org)
        org = Organizations(id=2, acronym="ORG2")
        db_session.add(org)
        org = Organizations(id=3, acronym="ORG3")
        db_session.add(org)

        test_user_read_role = User_affiliations(
            user_id=1, organization_id=1, permission="user_read"
        )
        db_session.add(test_user_read_role)
        test_super_admin_role = User_affiliations(
            user_id=2, organization_id=2, permission="super_admin"
        )
        db_session.add(test_super_admin_role)
        test_admin_role = User_affiliations(
            user_id=3, organization_id=1, permission="admin"
        )
        db_session.add(test_admin_role)
        test_admin_role = User_affiliations(
            user_id=4, organization_id=2, permission="admin"
        )
        db_session.add(test_admin_role)
        test_user_write_role = User_affiliations(
            user_id=5, organization_id=1, permission="user_write"
        )
        db_session.add(test_user_write_role)
        db_session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Organizations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures("users_resolver_test_db_init")
class TestUsersResolverAccessControl(TestCase):
    # Super Admin Tests
    def test_get_users_as_super_admin(self):
        """
        Test to see if users resolver access control allows super admin to
        request users outside of organization
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
                    users(org: "ORG1") {
                        edges {
                            node {
                                displayName
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
                    "users": {
                        "edges": [
                            {"node": {"displayName": "testuserread"}},
                            {"node": {"displayName": "testadmin"}},
                            {"node": {"displayName": "testuserwrite"}},
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    # Admin Same Org
    def test_get_users_from_same_org(self):
        """
        Test users query to see if an admin from the corresponding org can
        retrieve the information
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin@testemail.ca", password:"testpassword123"){
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
                    users(org: "ORG1") {
                        edges {
                            node {
                                displayName
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
                    "users": {
                        "edges": [
                            {"node": {"displayName": "testuserread"}},
                            {"node": {"displayName": "testadmin"}},
                            {"node": {"displayName": "testuserwrite"}},
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    # Admin different org
    def test_get_users_admin_from_different_org(self):
        """
        Test users query to see if an admin from anther org cannot
        retrieve the information
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testadmin2@testemail.ca", password:"testpassword123"){
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
                    users(org: "ORG1") {
                        edges {
                            node {
                                displayName
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
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have access to view this organization"
            )

    # User write tests
    def test_get_users_user_write(self):
        """
        Ensure user write cannot access this query
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            get_token = client.execute(
                """
                mutation{
                    signIn(userName:"testuserwrite@testemail.ca", password:"testpassword123"){
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
                    users(org: "ORG1") {
                        edges {
                            node {
                                displayName
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
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have access to view this organization"
            )

    # User read tests
    def test_get_users_user_read(self):
        """
        Ensure user read cannot access this query
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
                    users(org: "ORG1") {
                        edges {
                            node {
                                displayName
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
            assert (
                executed["errors"][0]["message"]
                == "Error, you do not have access to view this organization"
            )
