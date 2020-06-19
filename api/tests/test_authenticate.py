import logging
import pytest

from datetime import datetime
from pytest import fail

from db import DB
from functions.error_messages import (
    error_invalid_credentials,
    error_too_many_failed_login_attempts,
    error_user_does_not_exist,
)
from models import Users
from tests.test_functions import json, run


@pytest.fixture
def db():
    save, cleanup, session = DB()
    yield [save, session]
    cleanup()


def test_authenticate_with_valid_credentials(db, caplog):
    """
    Test that ensures a user can be signed in successfully
    """
    save, _ = db

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        # This mocks that the user is accessing the service 32 mins after their
        # last failed login attempt
        failed_login_attempt_time=datetime.now().timestamp() + 1920,
    )
    save(user)

    caplog.set_level(logging.INFO)
    actual = run(
        mutation="""
        mutation{
            authenticate(
                userName:"testuser@testemail.ca",
                password:"testpassword123"
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

    if "errors" in actual:
        fail(
            "expected signin for a normal user to succeed. Instead:"
            "{}".format(json(actual))
        )

    [username] = actual["data"]["authenticate"]["authResult"]["user"].values()
    assert username == "testuser@testemail.ca"
    assert f"Successfully reset user: {user.id} login attempts counter." in caplog.text
    assert f"User: {user.id} successfully authenticated their account." in caplog.text


def test_authenticate_with_invalid_credentials_fails(db, caplog):
    """
    Test that ensures a user can be signed in successfully
    """
    save, _ = db

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        # This mocks that the user is accessing the service 32 mins after their
        # last failed login attempt
        failed_login_attempt_time=datetime.now().timestamp() + 1920,
    )
    save(user)

    caplog.set_level(logging.INFO)
    actual = run(
        mutation="""
        mutation {
            authenticate(
                userName:"testuser@testemail.ca",
                password:"invalidpassword"
            ){
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in actual:
        fail(
            "expected signin with invalid credentials to raise an error. Instead:"
            "{}".format(json(actual))
        )

    [err] = actual["errors"]
    [message, _line, _field] = err.values()
    assert message == "Incorrect email or password"
    assert (
        f"Successfully increased login failed attempts counter for user: {user.id}"
        in caplog.text
    )
    assert (
        f"User attempted to authenticate an account {user.id} with invalid credentials."
        in caplog.text
    )


def test_authenticate_failed_login_attempts_are_recorded(db, caplog):
    save, session = db

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    caplog.set_level(logging.INFO)
    actual = run(
        mutation="""
        mutation {
            authenticate(
                userName:"testuser@testemail.ca"
                password:"invalidpassword"
            ){
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """
    )

    if "errors" not in actual:
        fail(
            "expected signin with invalid credentials to raise an error. Instead:"
            "{}".format(json(actual))
        )

    session.refresh(user)
    assert user.failed_login_attempts == 1
    assert user.failed_login_attempt_time is not 0
    assert (
        f"Successfully increased login failed attempts counter for user: {user.id}"
        in caplog.text
    )
    assert (
        f"User attempted to authenticate an account {user.id} with invalid credentials."
        in caplog.text
    )


def test_authenticate_successful_login_sets_failed_attempts_to_zero(db, caplog):
    """
    Test that ensures a user can be signed in, and that when they do, their
    user count is updated to be 0.
    """
    save, session = db

    user = Users(
        display_name="test_failed_user",
        user_name="failedb4@example.com",
        password="testpassword123",
        failed_login_attempts=3,
        failed_login_attempt_time=datetime.now().timestamp() + 1920,
    )
    save(user)

    caplog.set_level(logging.INFO)
    actual = run(
        mutation="""
        mutation {
            authenticate(
                userName:"failedb4@example.com",
                password:"testpassword123"
            ){
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """
    )

    session.refresh(user)
    assert user.failed_login_attempts == 0
    assert user.failed_login_attempt_time == 0
    assert f"Successfully reset user: {user.id} login attempts counter." in caplog.text
    assert f"User: {user.id} successfully authenticated their account." in caplog.text


def test_authenticate_too_many_failed_attempts(db, caplog):
    save, _ = db

    user = Users(
        display_name="failed2much",
        user_name="failed2much@example.com",
        password="testpassword123",
        failed_login_attempts=30,
        failed_login_attempt_time=0,
    )
    save(user)

    caplog.set_level(logging.WARNING)
    actual = run(
        """
        mutation{
            authenticate(
                userName:"failed2much@example.com",
                password:"testpassword123"
            ){
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in actual:
        fail(
            "expected signin with invalid credentials to raise an error. Instead:"
            "{}".format(json(actual))
        )

    [err] = actual["errors"]
    [message, _line, _field] = err.values()
    assert message == error_too_many_failed_login_attempts()
    assert (
        f"User: {user.id} tried to authenticate but has too many login attempts."
        in caplog.text
    )


def test_authenticating_in_with_unknown_users_returns_error(caplog):
    caplog.set_level(logging.WARNING)
    actual = run(
        """
        mutation{
            authenticate(
                userName:"null@example.com",
                password:"testpassword123"
            ){
                authResult {
                    user {
                        userName
                    }
                }
            }
        }
        """,
    )

    if "errors" not in actual:
        fail(
            "expected signin with invalid credentials to raise an error. Instead:"
            "{}".format(json(actual))
        )

    [err] = actual["errors"]
    [message, _line, _field] = err.values()
    assert message == error_user_does_not_exist()
    assert (
        f"User attempted to authenticate an account that does not exist using this username: null@example.com."
        in caplog.text
    )
