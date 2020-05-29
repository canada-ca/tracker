import pytest
import pytest_mock

from pytest import fail

from app import app
from db import DB
from models import Users
from functions.error_messages import *
from tests.test_functions import json, run


@pytest.fixture()
def save():
    with app.app_context():
        s, cleanup, db_session = DB()
        yield s
        cleanup()


def test_successful_creation_english(save, mocker):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                signUp(
                    displayName: "user-test"
                    userName: "different-email@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    preferredLang: ENGLISH
                ) {
                    authResult {
                        user {
                            userName
                            displayName
                            lang
                        }
                    }
                }
            }
            """,
        )

        if "errors" in result:
            fail("Tried to create a user, instead: {}".format(json(result)))

        expected_result = {
            "data": {
                "signUp": {
                    "authResult": {
                        "user": {
                            "userName": "different-email@testemail.ca",
                            "displayName": "user-test",
                            "lang": "english",
                        }
                    }
                }
            }
        }

        assert result == expected_result


def test_successful_creation_french(save, mocker):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                signUp(
                    displayName: "user-test"
                    userName: "different-email@testemail.ca"
                    password: "testpassword123"
                    confirmPassword: "testpassword123"
                    preferredLang: FRENCH
                ) {
                    authResult {
                        user {
                            userName
                            displayName
                            lang
                        }
                    }
                }
            }
            """,
        )

        if "errors" in result:
            fail("Tried to create a user, instead: {}".format(json(result)))

        expected_result = {
            "data": {
                "signUp": {
                    "authResult": {
                        "user": {
                            "userName": "different-email@testemail.ca",
                            "displayName": "user-test",
                            "lang": "french",
                        }
                    }
                }
            }
        }

        assert result == expected_result


def test_email_address_in_use(save):
    """Test that ensures each user has a unique email address"""
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    error_result = run(
        mutation="""
        mutation {
            signUp(
                displayName: "testuser"
                userName: "testuser@testemail.ca"
                password: "testpassword123"
                confirmPassword: "testpassword123"
                preferredLang: ENGLISH
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in error_result:
        fail(
            "Trying to create user with same username should fail, instead".format(
                json(error_result)
            )
        )

    [error] = error_result["errors"]
    assert error["message"] == error_email_in_use()


def test_password_too_short(save):
    """
    Test that ensure that a user's password meets the valid length requirements
    """
    result = run(
        mutation="""
        mutation {
            signUp(
                displayName: "testuser"
                userName: "testuser@testemail.ca"
                password: "test"
                confirmPassword: "test"
                preferredLang: FRENCH
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Password too short when creating user should error out, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_password_does_not_meet_requirements()


def test_passwords_do_not_match():
    """Test to ensure that user password matches their password confirmation"""
    result = run(
        mutation="""
        mutation {
            signUp(
                displayName: "testuser"
                userName: "testuser@testemail.ca"
                password: "testpassword123"
                confirmPassword: "passwordtest123"
                preferredLang: ENGLISH
            ) {
                authResult {
                    user {
                        userName
                        displayName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Passwords do not match when creating user should error, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_passwords_do_not_match()
