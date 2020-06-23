import logging
import pytest

from pytest import fail

from db import DB
from functions.error_messages import *
from models import Users
from tests.test_functions import run, json


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_update_password_success(save, caplog):
    """
    Test to ensure that a user is returned when their password is updated
    successfully
    """
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            updatePassword(userName: "testuser@testemail.ca", password: "another-super-long-password",
                confirmPassword: "another-super-long-password") {
                user {
                    userName
                    displayName
                }
            }
        }
        """,
        as_user=test_user,
    )

    if "errors" in result:
        fail("Tried to update password, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "updatePassword": {
                "user": {
                    "userName": "testuser@testemail.ca",
                    "displayName": "testuser",
                }
            }
        }
    }
    assert result == expected_result

    authenticate_test = run(
        mutation="""
        mutation{
            authenticate(
                userName:"testuser@testemail.ca",
                password:"another-super-long-password"
            ) {
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """,
    )
    [username] = authenticate_test["data"]["authenticate"]["authResult"][
        "user"
    ].values()
    assert username == "testuser@testemail.ca"
    assert f"User: {test_user.id} successfully updated their password." in caplog.text


def test_updated_passwords_do_not_match(save, caplog):
    """
    Test to ensure that user's new password matches their password confirmation
    """
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            updatePassword(userName: "testuser@testemail.ca", password: "a-super-long-password",
                confirmPassword: "another-super-long-password") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Tried to update passwords with mis-matching passwords, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_passwords_do_not_match()
    assert (
        f"User: {test_user.id} attempted to update password, but passwords did not match."
        in caplog.text
    )


def test_updated_password_too_short(save, caplog):
    """
    Test that ensure that a user's password meets the valid length requirements
    """
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            updatePassword(userName: "testuser@testemail.ca", password: "password", confirmPassword: "password") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Tried to update password with too short password, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_password_does_not_meet_requirements()
    assert (
        f"User: {test_user.id} attempted to update password, but requirements were not met."
        in caplog.text
    )


def test_updated_password_incorrect_email(save, caplog):
    """
    Test to ensure that an incorrect email address does not work
    """
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation="""
        mutation {
            updatePassword(userName: "testemail@email.ca", password: "valid-password", confirmPassword: "valid-password") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Tried to update password with no username, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "User does not exist, please register"
    assert (
        f"User attempted to update password for testemail@email.ca, but the account does not exist."
        in caplog.text
    )
