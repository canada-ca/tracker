import pytest
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Domains, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend

_, cleanup, db_session = DB()


@pytest.fixture(scope="function")
def domain_test_db_init():
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

        domain = Domains(id=1, domain="somecooldomain.ca", organization_id=1)
        db_session.add(domain)
        domain = Domains(id=2, domain="anothercooldomain.ca", organization_id=1)
        db_session.add(domain)
        domain = Domains(id=3, domain="somelamedomain.ca", organization_id=2)
        db_session.add(domain)
        db_session.commit()

        yield

        cleanup()


@pytest.mark.usefixtures("domain_test_db_init")
class TestDomainsResolver(TestCase):
    # Super Admin Tests
    def test_get_domain_resolvers_by_url_super_admin_single_node(self):
        """Test domain resolver by url as a super admin, single node return"""
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
                    domain(url: "somelamedomain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "somelamedomain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_get_domain_resolvers_by_org_super_admin_single_node(self):
        """
        Test domain resolver by organization as a super admin, single node
        return
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
                    domains(organization: "ORG2") {
                        edges {
                            node {
                                url
                            }
                        }
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {
                "data": {"domains": {"edges": [{"node": {"url": "somelamedomain.ca"}}]}}
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_domain_resolvers_by_org_super_admin_multi_node(self):
        """
        Test domain resolver by organization as a super admin, multi node return
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
                    domains(organization: "ORG1") {
                        edges {
                            node {
                                url
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
                    "domains": {
                        "edges": [
                            {"node": {"url": "somecooldomain.ca"}},
                            {"node": {"url": "anothercooldomain.ca"}},
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_domain_resolvers_by_url_super_admin_invalid_domain(self):
        """
        Test domain resolver by url as a super admin, invalid domain
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
                    domain(url: "google.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == "Error, domain does not exist"

    def test_get_domain_resolvers_by_org_super_admin_org_no_domains(self):
        """
        Test domain resolver by org as a super admin, org has no domains
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
                    domains(organization: "ORG3") {
                        edges {
                            node {
                                url
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
                == "Error, no domains associated with that organization"
            )

    # User read tests
    def test_get_domain_resolvers_by_url_user_read_single_node(self):
        """
        Test domain resolver get domain by url as user read, return as
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
                    domain(url: "somecooldomain.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            result_refr = {"data": {"domain": [{"url": "somecooldomain.ca"}]}}
            self.assertDictEqual(result_refr, executed)

    def test_get_domain_resolvers_by_org_user_read_multi_node(self):
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
                    domains(organization: "ORG1") {
                        edges {
                            node {
                                url
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
                    "domains": {
                        "edges": [
                            {"node": {"url": "somecooldomain.ca"}},
                            {"node": {"url": "anothercooldomain.ca"}},
                        ]
                    }
                }
            }
            self.assertDictEqual(result_refr, executed)

    def test_get_domain_resolvers_by_url_user_read_no_access(self):
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
                    domain(url: "somelamedomain.ca") {
                        url
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
                == "Error, you do not have permission to view that domain"
            )

    def test_get_domain_resolvers_by_org_user_read_no_access(self):
        """
        Test domain resolver get domain by org as user read, user has no rights
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
                    domains(organization: "ORG2") {
                        edges {
                            node {
                                url
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

    def test_get_domain_resolvers_by_url_user_read_invalid_domain(self):
        """
        Test domain resolver get domain by url as user read, url does not
        exist
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
                    domain(url: "google.ca") {
                        url
                    }
                }
                """,
                context_value=request_headers,
                backend=backend,
            )
            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == "Error, domain does not exist"

    def test_get_domain_resolvers_by_org_user_read_org_no_domains(self):
        """
        Test domain resolver get domain by org as user read, org has no related
        domains
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
                    domains(organization: "ORG3") {
                        edges {
                            node {
                                url
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
