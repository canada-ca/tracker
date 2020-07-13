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


def test_successful_send_password_reset_link(save, mocker, caplog):
    """
    Test successful sendPasswordResetLink mutation
    """
    mocker.patch(
        "schemas.send_password_reset_email.send_password_reset_link.send_password_reset_email",
        autospec=True,
        return_value=True,
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
    with app.test_request_context():
        result = run(
            mutation="""
            mutation {
                sendPasswordResetLink(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" in result:
        fail(
            "Expected to send password reset email email, instead: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "sendPasswordResetLink": {
                "status": "If an account with this username is found, a password reset link will be found in your inbox."
            }
        }
    }

    assert result == expected_result
    assert f"User: {user.id}, successfully sent a password reset email." in caplog.text


def test_unsuccessful_send_password_reset_link_user_doesnt_exist(save, caplog):
    """
    Test to see error message occurs if user does not exist
    """
    caplog.set_level(logging.INFO)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            mutation="""
            mutation {
                sendPasswordResetLink(
                    userName: "testuserread@testemail.ca"
                ) {
                    status
                }
            }
            """
        )

    if "errors" in result:
        fail(
            "Expected to get and error that the user does not exist, instead: {}".format(
                json(result)
            )
        )

    expected_result = {
        "data": {
            "sendPasswordResetLink": {
                "status": "If an account with this username is found, a password reset link will be found in your inbox."
            }
        }
    }

    assert result == expected_result
    assert (
        f"A user attempted to send a password reset email for testuserread@testemail.ca but this user name is not affiliated with any account."
        in caplog.text
    )
