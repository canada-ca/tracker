import logging
import pytest

from pytest import fail

from db import DB
from json_web_token import tokenize
from models import Users
from tests.test_functions import json, run


@pytest.fixture
def save():
    s, cleanup, session = DB()
    yield s
    cleanup()


def test_successful_account_verification(save, caplog):
    """
    Test that an account can be successfully verified
    """
    user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(user)

    token = tokenize(user_id=user.id, exp_period=24)

    caplog.set_level(logging.INFO)
    result = run(
        mutation=f"""
        mutation {{
            emailVerifyAccount(
                input: {{
                    tokenString: "{token}"
                }}
            ) {{
                status
            }}
        }}
        """,
        as_user=user,
    )

    if "errors" in result:
        fail("expected account to be verified. Instead:" "{}".format(json(result)))

    expected_result = {"data": {"emailVerifyAccount": {"status": True}}}

    assert result == expected_result
    assert f"User: {user.id} successfully verified their account." in caplog.text

    result = run(
        query="""
        {
            user {
                emailValidated
            }
        }
        """,
        as_user=user,
    )

    if "errors" in result:
        fail("expected account to be verified. Instead:" "{}".format(json(result)))

    expected_result = {"data": {"user": [{"emailValidated": True}]}}

    assert result == expected_result
    assert (
        f"User {user.id} successfully retrieved their own information." in caplog.text
    )


def test_email_account_verification_where_account_doesnt_exist(save, caplog):
    """
    Test that log, and error occurs when user doesn't exist
    """
    token = tokenize(user_id=5, exp_period=24)

    caplog.set_level(logging.WARNING)
    result = run(
        mutation=f"""
        mutation {{
            emailVerifyAccount(
                input: {{
                    tokenString: "{token}"
                }}
            ) {{
                status
            }}
        }}
        """,
    )

    if "errors" not in result:
        fail(
            "expected emailVerifyAccount to fail when user does not exist. Instead: {}".format(
                json(result)
            )
        )

    errors, data = result.values()
    [first] = errors
    message, _, _ = first.values()
    assert message == "Error, unable to verify account."
    assert (
        f"User: {5} attempted to verify their account but it does not exist."
        in caplog.text
    )
