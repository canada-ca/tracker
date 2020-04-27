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
def org_perm_test_db_init():
    with app.app_context():
        test_user = Users(
            id=1,
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_user)
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_super_admin)

        org = Organizations(
            id=1, acronym="ORG1", org_tags={"description": "Organization 1"}
        )
        db_session.add(org)
        org = Organizations(
            id=2, acronym="ORG2", org_tags={"description": "Organization 2"}
        )
        db_session.add(org)
        org = Organizations(
            id=3, acronym="ORG3", org_tags={"description": "Organization 3"}
        )
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


@pytest.mark.usefixtures("org_perm_test_db_init")
class TestOrgResolverWithOrgs(TestCase):
    # Super Admin Tests
    def test_get_org_resolvers_by_org_super_admin_single_node(self):
        """
        Test org resolver by organization as a super admin, single node return
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
                    organization(org: "ORG1") {
                        edges {
                            node {
                                acronym
                            }
                        }
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"organization": {"edges": [{"node": {"acronym": "ORG1"}}]}}
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_org_resolvers_super_admin_multi_node(self):
        """
        Test organization resolver as a super admin, multi node return
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
                    organizations {
                        edges {
                            node {
                                acronym
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
                    "organizations": {
                        "edges": [
                            {"node": {"acronym": "ORG1"}},
                            {"node": {"acronym": "ORG2"}},
                            {"node": {"acronym": "ORG3"}},
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    # User read tests
    def test_get_org_resolvers_by_org_user_read_single_node(self):
        """
        Test orgnization resolver by org as user read, return as
        single node
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
                    organization(org: "ORG1") {
                        edges {
                            node {
                                acronym
                            }
                        }
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"organization": {"edges": [{"node": {"acronym": "ORG1"}}]}}
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_org_resolvers_by_org_user_read_multi_node(self):
        """
        Test domain resolver get domain by org as user read, return as
        multi node
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
                    organizations {
                        edges {
                            node {
                                acronym
                            }
                        }
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"organizations": {"edges": [{"node": {"acronym": "ORG1"}}]}}
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_org_resolvers_by_org_user_read_no_access(self):
        """
        Test domain resolver get domain by url as user read, user has no rights
        to view domains related to that org
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
                    organization(org: "ORG2") {
                        edges {
                            node {
                                acronym
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
                == "Error, you do not have permission to view that organization"
            )


@pytest.fixture(scope="class")
def org_no_perm_test_db_init():

    with app.app_context():
        test_super_admin = Users(
            id=2,
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
        )
        db_session.add(test_super_admin)
        test_admin_role = User_affiliations(user_id=2, permission="super_admin")
        db_session.add(test_admin_role)
        db_session.commit()

    yield

    with app.app_context():
        User_affiliations.query.delete()
        Users.query.delete()
        db_session.commit()


@pytest.mark.usefixtures("org_no_perm_test_db_init")
class TestOrgResolverWithoutOrgs(TestCase):
    def test_get_org_resolvers_super_admin_no_orgs(self):
        """
        Test org resolver by organization as a super admin, no orgs exist
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
                    organizations {
                        edges {
                            node {
                                acronym
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
            assert executed["errors"][0]["message"] == "Error, no organizations to view"

    def test_get_org_resolvers_by_org_super_admin_no_orgs(self):
        """
        Test org resolver by organization as a super admin, no orgs exist
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
                    organization(org: "ORG3"){
                        edges {
                            node {
                                acronym
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
                executed["errors"][0]["message"] == "Error, organization does not exist"
            )
