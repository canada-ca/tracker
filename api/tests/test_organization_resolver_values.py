import pytest
import json
from pytest import fail
from flask import Request
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Domains, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend

save, cleanup, db_session = DB()


@pytest.fixture(scope="function")
def org_perm_test_db_init():
    with app.app_context():
        org1 = Organizations(
            acronym="ORG1",
            domains=[Domains(domain="somecooldomain.ca")],
            name="Organization 1",
            org_tags={
                "zone": "Prov",
                "sector": "Banking",
                "province": "Alberta",
                "city": "Calgary",
            },
        )
        save(org1)
        org2 = Organizations(
            acronym="ORG2",
            domains=[Domains(domain="anothercooldomain.ca")],
            name="Organization 2",
            org_tags={
                "zone": "Muni",
                "sector": "Transportation",
                "province": "NS",
                "city": "Halifax",
            },
        )
        save(org2)
        org3 = Organizations(
            acronym="ORG3",
            domains=[Domains(domain="somelamedomain.ca")],
            name="Organization 3",
            org_tags={
                "zone": "Federal",
                "sector": "Arts",
                "province": "Ontario",
                "city": "Toronto",
            },
        )
        save(org3)
        user = Users(
            display_name="testuserread",
            user_name="testuserread@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="user_read")
            ],
        )
        super_admin = Users(
            display_name="testsuperadmin",
            user_name="testsuperadmin@testemail.ca",
            password="testpassword123",
            user_affiliation=[
                User_affiliations(user_organization=org1, permission="super_admin")
            ],
        )

        save(user)
        save(super_admin)

        yield

        cleanup()


@pytest.mark.usefixtures("org_perm_test_db_init")
# Super Admin Tests
def test_get_org_resolvers_by_org_super_admin_single_node():
    """
    Test org resolver by organization as a super admin, single node return
    with all values
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

        actual = client.execute(
            """
            {
                organization(slug: "organization-1") {
                    edges {
                        node {
                            acronym
                            name
                            slug
                            zone
                            sector
                            province
                            city
                            domains {
                                edges {
                                    node {
                                        url
                                    }
                                }
                            }
                            affiliatedUsers {
                                edges {
                                    node {
                                        user {
                                            displayName
                                        }
                                        permission
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        expected = {
            "data": {
                "organization": {
                    "edges": [
                        {
                            "node": {
                                "acronym": "ORG1",
                                "name": "Organization 1",
                                "slug": "organization-1",
                                "zone": "Prov",
                                "sector": "Banking",
                                "province": "Alberta",
                                "city": "Calgary",
                                "domains": {
                                    "edges": [{"node": {"url": "somecooldomain.ca"}}]
                                },
                                "affiliatedUsers": {
                                    "edges": [
                                        {
                                            "node": {
                                                "user": {"displayName": "testuserread"},
                                                "permission": "USER_READ",
                                            }
                                        },
                                        {
                                            "node": {
                                                "user": {
                                                    "displayName": "testsuperadmin"
                                                },
                                                "permission": "SUPER_ADMIN",
                                            }
                                        },
                                    ]
                                },
                            }
                        }
                    ]
                }
            }
        }

        if "errors" in actual:
            fail(
                "Expected super admin to return results for all users but got: {}".format(
                    actual["errors"]
                )
            )

        assert actual == expected


@pytest.mark.usefixtures("org_perm_test_db_init")
def test_get_org_resolvers_super_admin_multi_node():
    """
    Test organization resolver as a super admin, multi node return with
    all values
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
        if "errors" in get_token:
            print(get_token["errors"])
        assert get_token["data"]["signIn"]["authToken"] is not None
        token = get_token["data"]["signIn"]["authToken"]
        assert token is not None

        environ = create_environ()
        environ.update(HTTP_AUTHORIZATION=token)
        request_headers = Request(environ)

        actual = client.execute(
            """
            {
                organizations {
                    edges {
                        node {
                            acronym
                            name
                            slug
                            zone
                            sector
                            province
                            city
                            domains {
                                edges {
                                    node {
                                        url
                                    }
                                }
                            }
                            affiliatedUsers {
                                edges {
                                    node {
                                        user {
                                            displayName
                                        }
                                        permission
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )

        expected = {
            "data": {
                "organizations": {
                    "edges": [
                        {
                            "node": {
                                "acronym": "ORG1",
                                "name": "Organization 1",
                                "slug": "organization-1",
                                "zone": "Prov",
                                "sector": "Banking",
                                "province": "Alberta",
                                "city": "Calgary",
                                "domains": {
                                    "edges": [{"node": {"url": "somecooldomain.ca"}}]
                                },
                                "affiliatedUsers": {
                                    "edges": [
                                        {
                                            "node": {
                                                "user": {"displayName": "testuserread"},
                                                "permission": "USER_READ",
                                            }
                                        },
                                        {
                                            "node": {
                                                "user": {
                                                    "displayName": "testsuperadmin"
                                                },
                                                "permission": "SUPER_ADMIN",
                                            }
                                        },
                                    ]
                                },
                            }
                        },
                        {
                            "node": {
                                "acronym": "ORG2",
                                "name": "Organization 2",
                                "slug": "organization-2",
                                "zone": "Muni",
                                "sector": "Transportation",
                                "province": "NS",
                                "city": "Halifax",
                                "domains": {
                                    "edges": [{"node": {"url": "anothercooldomain.ca"}}]
                                },
                                "affiliatedUsers": {"edges": []},
                            }
                        },
                        {
                            "node": {
                                "acronym": "ORG3",
                                "name": "Organization 3",
                                "slug": "organization-3",
                                "zone": "Federal",
                                "sector": "Arts",
                                "province": "Ontario",
                                "city": "Toronto",
                                "domains": {
                                    "edges": [{"node": {"url": "somelamedomain.ca"}}]
                                },
                                "affiliatedUsers": {"edges": []},
                            }
                        },
                        {
                            "node": {
                                "acronym": "TESTUSERRE",
                                "name": "testuserread@testemail.ca",
                                "slug": "testuserread-testemail-ca",
                                "zone": None,
                                "sector": None,
                                "province": None,
                                "city": None,
                                "domains": {"edges": []},
                                "affiliatedUsers": {
                                    "edges": [
                                        {
                                            "node": {
                                                "user": {"displayName": "testuserread"},
                                                "permission": "ADMIN",
                                            }
                                        }
                                    ]
                                },
                            }
                        },
                        {
                            "node": {
                                "acronym": "TESTSUPERA",
                                "name": "testsuperadmin@testemail.ca",
                                "slug": "testsuperadmin-testemail-ca",
                                "zone": None,
                                "sector": None,
                                "province": None,
                                "city": None,
                                "domains": {"edges": []},
                                "affiliatedUsers": {
                                    "edges": [
                                        {
                                            "node": {
                                                "user": {
                                                    "displayName": "testsuperadmin"
                                                },
                                                "permission": "ADMIN",
                                            }
                                        }
                                    ]
                                },
                            }
                        },
                    ]
                }
            }
        }

        if "errors" in actual:
            fail(
                "Expected super admin to return results for all users but got: {}".format(
                    actual["errors"]
                )
            )

        assert actual == expected


# User read tests
@pytest.mark.usefixtures("org_perm_test_db_init")
def test_get_org_resolvers_by_org_user_read_single_node():
    """
    Test org resolver with an org as a user read, multi node return with
    all values
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

        actual = client.execute(
            """
            {
                organization(slug: "organization-1") {
                    edges {
                        node {
                            acronym
                            name
                            slug
                            zone
                            sector
                            province
                            city
                            domains {
                                edges {
                                    node {
                                        url
                                    }
                                }
                            }
                            affiliatedUsers {
                                edges {
                                    node {
                                        user {
                                            displayName
                                        }
                                        permission
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        expected = {
            "data": {
                "organization": {
                    "edges": [
                        {
                            "node": {
                                "acronym": "ORG1",
                                "name": "Organization 1",
                                "slug": "organization-1",
                                "zone": "Prov",
                                "sector": "Banking",
                                "province": "Alberta",
                                "city": "Calgary",
                                "domains": {
                                    "edges": [{"node": {"url": "somecooldomain.ca"}}]
                                },
                                "affiliatedUsers": {"edges": []},
                            }
                        }
                    ]
                }
            }
        }

        assert actual == expected


@pytest.mark.usefixtures("org_perm_test_db_init")
def test_get_org_resolvers_by_org_user_read_multi_node():
    """
    Test organizations resolver as a user read, multi node return with
    all values
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

        actual = client.execute(
            """
            {
                organizations {
                    edges {
                        node {
                            acronym
                            name
                            slug
                            zone
                            sector
                            province
                            city
                            domains {
                                edges {
                                    node {
                                        url
                                    }
                                }
                            }
                            affiliatedUsers {
                                edges {
                                    node {
                                        user {
                                            displayName
                                        }
                                        permission
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """,
            context_value=request_headers,
            backend=backend,
        )
        expected = {
            "data": {
                "organizations": {
                    "edges": [
                        {
                            "node": {
                                "acronym": "ORG1",
                                "name": "Organization 1",
                                "slug": "organization-1",
                                "zone": "Prov",
                                "sector": "Banking",
                                "province": "Alberta",
                                "city": "Calgary",
                                "domains": {
                                    "edges": [{"node": {"url": "somecooldomain.ca"}}]
                                },
                                "affiliatedUsers": {"edges": []},
                            }
                        },
                        {
                            "node": {
                                "acronym": "TESTUSERRE",
                                "name": "testuserread@testemail.ca",
                                "slug": "testuserread-testemail-ca",
                                "zone": None,
                                "sector": None,
                                "province": None,
                                "city": None,
                                "domains": {"edges": []},
                                "affiliatedUsers": {
                                    "edges": [
                                        {
                                            "node": {
                                                "user": {"displayName": "testuserread"},
                                                "permission": "ADMIN",
                                            }
                                        }
                                    ]
                                },
                            }
                        },
                    ]
                }
            }
        }

        if "errors" in actual:
            fail("Expect success but errors were returned: {}".format(actual["errors"]))
        assert actual == expected
