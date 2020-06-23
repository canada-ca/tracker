import logging
import pytest

from pytest import fail

from app import app
from db import DB
from models.Users import Users
from tests.test_functions import json, run


@pytest.fixture()
def save():
    s, cleanup, db_session = DB()
    yield s
    cleanup()


def test_successful_send_verification_email_mutation(save, caplog):
    """
    Test to see if un-verified user can send verification email
    """
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" in result:
        fail("Expected to send verification email, instead: {}".format(json(result)))

    expected_result = {"data": {"sendEmailVerification": {"status": True}}}

    assert result == expected_result
    assert f"User: {user.id} successfully sent verification email." in caplog.text


def test_send_verification_email_mutation_user_already_verified(save, caplog):
    """
    Test to see error message occurs if user is already validated
    """
    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    user.verify_account()
    save(user)

    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" not in result:
        fail(
            "Expected to get and error that the user is already verified, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, user is already validated."
    assert (
        f"User: {user.id} tried to verify an account but it has already been verified."
        in caplog.text
    )


def test_send_verification_email_mutation_email_send_error_permanent_failure(
    save, mocker, caplog
):
    """
    Test to see error message occurs if permanent-failure occurs
    """
    mocker.patch(
        "schemas.send_email_verification.send_email_verification.send_verification_email",
        autospec=True,
        return_value="Email Send Error: permanent-failure",
    )

    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" not in result:
        fail(
            "Expected to get and error that the user is already verified, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, when sending verification email, please try again."
    )
    assert (
        f"User: {user.id} tried to send verification email, but error occurred Email Send Error: permanent-failure"
        in caplog.text
    )


def test_send_verification_email_mutation_email_send_error_temporary_failure(
    save, mocker, caplog
):
    """
    Test to see error message occurs if temporary-failure occurs
    """
    mocker.patch(
        "schemas.send_email_verification.send_email_verification.send_verification_email",
        autospec=True,
        return_value="Email Send Error: temporary-failure",
    )

    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" not in result:
        fail(
            "Expected to get and error that the user is already verified, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, when sending verification email, please try again."
    )
    assert (
        f"User: {user.id} tried to send verification email, but error occurred Email Send Error: temporary-failure"
        in caplog.text
    )


def test_send_verification_email_mutation_email_send_error_technical_failure(
    save, mocker, caplog
):
    """
    Test to see error message occurs if technical-failure occurs
    """
    mocker.patch(
        "schemas.send_email_verification.send_email_verification.send_verification_email",
        autospec=True,
        return_value="Email Send Error: technical-failure",
    )

    user = Users(
        display_name="testuserread",
        user_name="testuserread@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )
    save(user)

    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" not in result:
        fail(
            "Expected to get and error that the user is already verified, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert (
        error["message"] == "Error, when sending verification email, please try again."
    )
    assert (
        f"User: {user.id} tried to send verification email, but error occurred Email Send Error: technical-failure"
        in caplog.text
    )


def test_send_verification_email_mutation_user_cant_be_found(save, caplog):
    """
    Test to see if user can't be found error message is sent
    """
    caplog.set_level(logging.WARNING)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendEmailVerification(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" not in result:
        fail(
            "Expected to get and error that the user cant be found, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == "Error, unable to send verification email."
    assert (
        f"User: testuserread@testemail.ca tried to verify an account but it does not exist."
        in caplog.text
    )
