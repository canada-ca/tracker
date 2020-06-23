import pyotp
import pytest
from pytest import fail

from db import DB
from models import Users
from functions.error_messages import *
from tests.test_functions import json, run


@pytest.fixture()
def save():
    s, cleanup, db_session = DB()
    yield s
    cleanup()


# XXX: convert this to pytest style
@pytest.fixture(scope="function")
def user_schema_test_db_init():
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    db_session.add(test_user)
    test_admin = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
    )
    db_session.add(test_admin)
    db_session.commit()

    yield

    cleanup()


def test_successful_validation(save):
    """
    Test that ensures a validation is successful when all params are proper
    """
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    totp = pyotp.TOTP("base32secret3232")
    otp_code = (
        totp.now()
    )  # Generates a code that is valid for 30s. Plenty of time to execute the query

    result = run(
        mutation='''
        mutation {
            authenticateTwoFactor(userName: "testuser@testemail.ca", otpCode: "'''
        + otp_code
        + """") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" in result:
        fail("Tried to validate account, instead: {}".format(json(result)))

    expected_result = {
        "data": {
            "authenticateTwoFactor": {"user": {"userName": "testuser@testemail.ca"}}
        }
    }

    assert result == expected_result


def test_user_does_not_exist():
    """Test that an error is raised if the user specified does not exist"""
    result = run(
        mutation="""
        mutation {
            authenticateTwoFactor(userName: "anotheruser@testemail.ca", otpCode: "000000") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail(
            "Tried to validate account that does not exist, instead: {}".format(
                json(result)
            )
        )

    [error] = result["errors"]
    assert error["message"] == error_user_does_not_exist()


def test_invalid_otp_code(save):
    """Test that an error is raised if the user specified does not exist"""
    test_user = Users(
        display_name="testuser",
        user_name="testuser@testemail.ca",
        password="testpassword123",
    )
    save(test_user)

    result = run(
        mutation="""
        mutation {
            authenticateTwoFactor(userName: "testuser@testemail.ca", otpCode: "000000") {
                user {
                    userName
                }
            }
        }
        """,
    )

    if "errors" not in result:
        fail("Tried to validate with invalid code, instead: {}".format(json(result)))

    [error] = result["errors"]
    assert error["message"] == error_otp_code_is_invalid()
