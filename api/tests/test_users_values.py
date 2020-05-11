import pytest
from pytest import fail
from json import dumps
from json_web_token import tokenize, auth_header
from flask import Request
from graphene.test import Client
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Users, User_affiliations
from queries import schema
from backend.security_check import SecurityAnalysisBackend


def json(j):
    return dumps(j, indent=2)


s, cleanup, db_session = DB()


@pytest.fixture
def save():
    with app.app_context():
        yield s
        cleanup()


def test_get_users_as_super_admin(save):
    """
    Test to see if users resolver will return all information to super admin
    """
    org1 = Organizations(acronym="ORG1")
    org2 = Organizations(acronym="ORG2")

    reader = Users(
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
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(writer)

    token = tokenize(user_id=super_admin.id, roles=super_admin.roles)

    actual = Client(schema).execute(
        """
        {
            users(org: "ORG1") {
                edges {
                    node {
                        userName
                        displayName
                        permission
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )

    expected = {
        "data": {
            "users": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "permission": "USER_READ",
                        }
                    },
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "permission": "ADMIN",
                        }
                    },
                    {
                        "node": {
                            "userName": "testuserwrite@testemail.ca",
                            "displayName": "testuserwrite",
                            "permission": "USER_WRITE",
                        }
                    },
                ]
            }
        }
    }

    if "errors" in actual:
        fail("Expected query to succeed. Instead:" "{}".format(json(actual)))
    assert actual == expected


def test_get_users_as_admin(save):
    """
    Test to see if users resolver will return all information to org admin
    """
    org1 = Organizations(acronym="ORG1")
    org2 = Organizations(acronym="ORG2")

    reader = Users(
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
            User_affiliations(user_organization=org2, permission="super_admin")
        ],
    )
    org1_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="admin")
        ],
    )
    writer = Users(
        display_name="testuserwrite",
        user_name="testuserwrite@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="user_write")
        ],
    )
    save(reader)
    save(super_admin)
    save(org1_admin)
    save(writer)

    token = tokenize(user_id=org1_admin.id, roles=org1_admin.roles)

    actual = Client(schema).execute(
        """
        {
            users(org: "ORG1") {
                edges {
                    node {
                        userName
                        displayName
                        permission
                    }
                }
            }
        }
        """,
        context_value=auth_header(token),
    )
    expected = {
        "data": {
            "users": {
                "edges": [
                    {
                        "node": {
                            "userName": "testuserread@testemail.ca",
                            "displayName": "testuserread",
                            "permission": "USER_READ",
                        }
                    },
                    {
                        "node": {
                            "userName": "testadmin@testemail.ca",
                            "displayName": "testadmin",
                            "permission": "ADMIN",
                        }
                    },
                    {
                        "node": {
                            "userName": "testuserwrite@testemail.ca",
                            "displayName": "testuserwrite",
                            "permission": "USER_WRITE",
                        }
                    },
                ]
            }
        }
    }
    assert actual == expected
