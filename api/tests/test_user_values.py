import pytest
from pytest import fail
from json import dumps
from flask import Request
from json_web_token import tokenize, auth_header
from graphene.test import Client
from unittest import TestCase
from werkzeug.test import create_environ
from app import app
from db import DB
from models import Organizations, Users, User_affiliations
from queries import schema

s, cleanup, session = DB()


def json(j):
    return dumps(j, indent=2)


@pytest.fixture
def save():
    with app.app_context():
        yield s
        cleanup()


def test_get_another_users_information(save):
    """
    Test to see if an admin can select another users information
    """
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
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)

    token = tokenize(user_id=super_admin.id, roles=super_admin.roles)

    actual = Client(schema).execute(
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
        context_value=auth_header(token),
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
    assert actual == expected


def test_get_another_users_information_user_does_not_exist(save):
    """
    Test to see that error message appears when user does not exist
    """
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
    super_admin = Users(
        display_name="testsuperadmin",
        user_name="testsuperadmin@testemail.ca",
        password="testpassword123",
        user_affiliation=[
            User_affiliations(user_organization=org1, permission="super_admin")
        ],
    )
    save(super_admin)

    token = tokenize(user_id=super_admin.id, roles=super_admin.roles)

    actual = Client(schema).execute(
        """
        {
            user(userName: "IdontThinkSo@testemail.ca") {
                userName
            }
        }
        """,
        context_value=auth_header(token),
    )

    if "errors" not in actual:
        fail(
            "Expected retrieval of not existant user to fail. Instead:"
            "{}".format(json(actual))
        )
    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, user cannot be found"


# User read tests
def test_get_own_user_information(save):
    """
    Test to see if user can access all user object values
    """

    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
        user_affiliation=[
            User_affiliations(
                user_organization=Organizations(acronym="ORG1"), permission="user_read"
            )
        ],
    )
    save(user)

    token = tokenize(user_id=user.id, roles=user.roles)

    executed = Client(schema).execute(
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
        context_value=auth_header(token),
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
    assert result_refr == executed
