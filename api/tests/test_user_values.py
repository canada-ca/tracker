import logging
import pytest

from pytest import fail

from db import DB
from models import Organizations, Users, User_affiliations
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_get_another_users_information(save, caplog):
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

    caplog.set_level(logging.INFO)
    actual = run(
        query="""
        {
            user(userName: "testuserread@testemail.ca") {
                userName
                displayName
                lang
                tfa
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" in actual:
        fail("Tried to get user info as super admin, instead: {}".format(json(actual)))

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
    assert (
        f"Super admin {super_admin.id} successfully retrieved the user information for this user testuserread@testemail.ca."
        in caplog.text
    )


def test_get_another_users_information_user_does_not_exist(save, caplog):
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

    caplog.set_level(logging.WARNING)
    actual = run(
        query="""
        {
            user(userName: "IdontThinkSo@testemail.ca") {
                userName
            }
        }
        """,
        as_user=super_admin,
    )

    if "errors" not in actual:
        fail(
            "Expected retrieval of non-existent user to fail. Instead:"
            "{}".format(json(actual))
        )

    [err] = actual["errors"]
    [message, _, _] = err.values()
    assert message == "Error, user cannot be found."
    assert (
        f"User: {super_admin.id}, tried to find this user IdontThinkSo@testemail.ca but the account does not exist."
        in caplog.text
    )


# User read tests
def test_get_own_user_information(save, caplog):
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

    caplog.set_level(logging.INFO)
    result = run(
        query="""
        {
            user {
                userName
                displayName
                lang
                tfa
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail("Tried to grab users own information, instead: {}".format(json(result)))

    expected_result = {
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
    assert result == expected_result
    assert (
        f"User {user.id} successfully retrieved their own information." in caplog.text
    )
