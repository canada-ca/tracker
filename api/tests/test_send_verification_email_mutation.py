import pytest

from pytest import fail

from app import app
from db import DB
from models.Users import Users
from tests.test_functions import json, run


@pytest.fixture()
def save():
    with app.app_context():
        s, cleanup, db_session = DB()
        yield s
        cleanup()


def test_successful_send_verification_email_mutation(save):
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
        fail(
            "Expected to send verification email, instead: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "sendEmailVerification": {
                "status": True
            }
        }
    }

    assert result == expected_result


def test_send_verification_email_mutation_user_already_verified(save):
    """
    Test to see if user can't be found error message is sent
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


def test_send_verification_email_mutation_user_cant_be_found(save):
    """
    Test to see if user can't be found error message is sent
    """
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
    assert error["message"] == "Error, cannot find user."
