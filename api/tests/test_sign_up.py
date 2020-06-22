import logging
import pytest
import pytest_mock

from pytest import fail

from app import app
from db import DB
from models import Users
from functions.error_messages import *
from tests.test_functions import json, run


@pytest.fixture()
def db():
    s, cleanup, db_session = DB()
    yield s, db_session
    cleanup()


def test_successful_creation_english(db, mocker, caplog):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    _, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    caplog.set_level(logging.INFO)
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

        user = (
            session.query(Users)
            .filter(Users.user_name == "different-email@testemail.ca")
            .first()
        )

        assert result == expected_result
        assert f"Successfully created new user: {user.id}" in caplog.text


def test_successful_creation_french(db, mocker, caplog):
    """
    Test that ensures a user can be created successfully using the api endpoint
    """
    _, session = db

    mocker.patch(
        "schemas.sign_up.create_user.send_verification_email",
        autospec=True,
        return_value="delivered",
    )

    caplog.set_level(logging.INFO)
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

        user = (
            session.query(Users)
            .filter(Users.user_name == "different-email@testemail.ca")
            .first()
        )

        assert result == expected_result
        assert f"Successfully created new user: {user.id}" in caplog.text


def test_email_address_in_use(db, caplog):
    """Test that ensures each user has a unique email address"""
    save, session = db

    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    caplog.set_level(logging.WARNING)
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

    user = (
        session.query(Users).filter(Users.user_name == "testuser@testemail.ca").first()
    )

    [error] = error_result["errors"]
    assert error["message"] == error_email_in_use()
    assert (
        f"User tried to sign up using: testuser@testemail.ca but account already exists {user.id}"
        in caplog.text
    )


def test_password_too_short(db, caplog):
    """
    Test that ensure that a user's password meets the valid length requirements
    """
    save, _ = db

    caplog.set_level(logging.WARNING)
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
    assert (
        f"User: testuser@testemail.ca tried to sign up but password did not meet requirements."
        in caplog.text
    )


def test_passwords_do_not_match(caplog):
    """
    Test to ensure that user password matches their password confirmation
    """
    caplog.set_level(logging.WARNING)
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
    assert (
        f"User: testuser@testemail.ca tried to sign up but passwords were not matching."
        in caplog.text
    )
