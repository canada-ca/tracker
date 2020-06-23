import logging
import pytest
import pytest_mock

from pytest import fail

from db import DB
from functions.error_messages import *
from models import Users
from tests.test_functions import run, json


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_successfully_validate_two_factor(save, mocker, caplog):
    """
    Test to ensure that an account can successfully be tfa validated
    """

    mocker.patch(
        "schemas.validate_two_factor.validate.pyotp.totp.TOTP.verify",
        autospec=True,
        return_value=True,
    )

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            authenticateTwoFactor (
                otpCode: "123456"
                userName: "testuser@testemail.ca"
            ) {
                user {
                    tfa
                }
            }
        }
        """
    )

    if "errors" in result:
        fail("Tried to tfa validate account, instead: {}".format(json(result)))

    expected_result = {"data": {"authenticateTwoFactor": {"user": {"tfa": True,}}}}
    assert result == expected_result
    assert f"User: {user.id} successfully tfa validated their account." in caplog.text


def test_invalid_otp_code_validate_two_factor(save, mocker, caplog):
    """
    Test to ensure that error out with invalid otp code
    """

    mocker.patch(
        "schemas.validate_two_factor.validate.pyotp.totp.TOTP.verify",
        autospec=True,
        return_value=False,
    )

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            authenticateTwoFactor (
                otpCode: "123456"
                userName: "testuser@testemail.ca"
            ) {
                user {
                    tfa
                }
            }
        }
        """
    )

    if "errors" not in result:
        fail(
            "Tried to fail test with invalid otp code, instead: {}".format(json(result))
        )

    [error] = result["errors"]
    assert error["message"] == error_otp_code_is_invalid()
    assert (
        f"User: {user.id} attempted to tfa validate their account but their otp code was incorrect."
        in caplog.text
    )


def test_invalid_user_name_validate_two_factor(save, mocker, caplog):
    """
    Test to ensure that error out with invalid user name
    """

    mocker.patch(
        "schemas.validate_two_factor.validate.pyotp.totp.TOTP.verify",
        autospec=True,
        return_value=False,
    )

    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    caplog.set_level(logging.INFO)
    result = run(
        mutation="""
        mutation {
            authenticateTwoFactor (
                otpCode: "123456"
                userName: "test-user@testemail.ca"
            ) {
                user {
                    tfa
                }
            }
        }
        """
    )

    if "errors" not in result:
        fail(
            "Tried to fail test with invalid otp code, instead: {}".format(json(result))
        )

    [error] = result["errors"]
    assert error["message"] == error_user_does_not_exist()
    assert (
        f"User test-user@testemail.ca attempted to verify account, but no account associated with that username."
        in caplog.text
    )
