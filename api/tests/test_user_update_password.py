import logging
import pytest

from pytest import fail

from db import DB
from functions.error_messages import (
    error_passwords_do_not_match,
    error_password_does_not_meet_requirements,
)
from json_web_token import tokenize
from models import Users
from tests.test_functions import run, json


@pytest.fixture
def save():
    save, cleanup, session = DB()
    yield save
    cleanup()


def test_successful_password_update(save, caplog):
    """
    Test that a user can successfully update their password
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"user_id": user.id, "current_password": user.password}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" in result:
        fail(
            "Error occurred when trying to get a reset user password, error: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "updatePassword": {
                "status": "Successfully updated user password, please sign in with new password."
            }
        }
    }

    assert result == expected_result
    assert f"User: {user.id} successfully updated their password." in caplog.text


def test_unsuccessful_password_update_passwords_not_matching(save, caplog):
    """
    Test that an error occurs if a user attempts to update their password when
    the updated password fields do not match
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"user_id": user.id, "current_password": user.password}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "thisPasswordDoesntMatch"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with not matching passwords, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_passwords_do_not_match()
    assert (
        f"User: {user.id} attempted to update password, but passwords did not match."
        in caplog.text
    )


def test_unsuccessful_password_update_passwords_not_meeting_requirements(save, caplog):
    """
    Test that an error occurs if a user attempts to update their password when
    the updated password fields do not meet GoC requirements
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"user_id": user.id, "current_password": user.password}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "test"
                    confirmPassword: "test"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with not strong passwords, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_password_does_not_meet_requirements()
    assert (
        f"User: {user.id} attempted to update password, but requirements were not met."
        in caplog.text
    )


def test_unsuccessful_password_update_password_hash_in_token_not_matching(save, caplog):
    """
    Test that an error occurs if a user attempts to update their password when
    the current_password field in the token does not match the current password
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"user_id": user.id, "current_password": "someRandomText"}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with current password not matching, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, please trying resetting password again."
    assert (
        f"User: {user.id} attempted to reset password, but the hashed password in the token did not match."
        in caplog.text
    )


def test_unsuccessful_password_update_user_id_is_empty_from_token(save, caplog):
    """
    Test that an error occurs if a user attempts to update their password when
    the user_id field in the token is missing
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"current_password": "someRandomText"}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with missing user_id field, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, please request another password reset email."
    assert (
        f"A user attempted to change password but user_id was not found in the reset token."
        in caplog.text
    )


def test_unsuccessful_password_update_current_password_is_empty_from_token(
    save, caplog
):
    """
    Test that an error occurs if a user attempts to update their password when
    the current_password field in the token is missing
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    parameters = {"user_id": user.id}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with missing current_password field, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, please request another password reset email."
    assert (
        f"A user attempted to change password but current_password was not found in the reset token."
        in caplog.text
    )


def test_unsuccessful_password_update_both_parameters_are_empty_from_token(
    save, caplog
):
    """
    Test that an error occurs if a user attempts to update their password when
    the user_id field in the token is empty
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    reset_token = tokenize(parameters={}, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with both current_password and user_id field missing, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, please request another password reset email."
    assert (
        f"A user attempted to change password but user_id and current_password was not found in the reset token."
        in caplog.text
    )


def test_unsuccessful_password_update_user_does_not_exist(save, caplog):
    """
    Test that an error occurs if an updatePassword mutation occurs but user is
    none
    """
    user_id = 5

    parameters = {"user_id": user_id, "current_password": "someRandomText"}

    reset_token = tokenize(parameters=parameters, exp_period=1)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            updatePassword(
                input: {{
                    resetToken: "{reset_token}"
                    password: "newpassword123"
                    confirmPassword: "newpassword123"
                }}
            ) {{
                status
            }}
        }}
        """
    )

    if "errors" not in result:
        fail(
            "Expected error to occur when trying to get a reset user password with a user id that doesn't exist, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, please request another password reset email."
    assert (
        f"User: {user_id} attempted to reset password, but there is no account affiliated with that id."
        in caplog.text
    )
