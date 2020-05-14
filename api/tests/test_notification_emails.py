import pytest

from graphene.test import Client

from functions.email_templates import (
    email_verification_template,
    password_reset_template,
)
from functions.error_messages import scalar_error_type
from app import app
from db import DB
from tests.test_functions import json, run


@pytest.fixture()
def save():
    s, cleanup, session = DB()
    yield s
    cleanup


def test_password_reset_email_sent_successfully():
    """Test for ensuring that an email is sent to a valid email address"""
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            """
            {
                sendPasswordReset(email: "testuser@testemail.ca") {
                    content{
                        body
                    }
                    template{
                        id
                    }
                }
            }
            """
        )

        assert result["data"]
        assert result["data"]["sendPasswordReset"]
        assert result["data"]["sendPasswordReset"]["content"]
        assert result["data"]["sendPasswordReset"]["content"]["body"]
        assert result["data"]["sendPasswordReset"]["template"]
        assert result["data"]["sendPasswordReset"]["template"]["id"]

        # Checks that the correct user name is sent.
        assert (
            "Hello testuser,"
            in result["data"]["sendPasswordReset"]["content"]["body"]
        )

        # Checks that the correct URL is sent
        assert (
            request_headers["Origin"]
            in result["data"]["sendPasswordReset"]["content"]["body"]
        )
        assert str(
            request_headers["Origin"] + "/reset-password/"
            in result["data"]["sendPasswordReset"]["content"]["body"]
        )

        # Checks that the correct template is sent.
        assert (
            result["data"]["sendPasswordReset"]["template"]["id"]
            == password_reset_template()
        )


def test_password_reset_invalid_email():
    """Tests to ensure that an invalid email address will raise an error"""
    result = run(
        """
        {
            sendPasswordReset(email: "invalid-email.ca") {
                    id
                }
        }
        """
    )
    assert result["errors"]
    assert result["errors"][0]
    assert result["errors"][0]["message"] == scalar_error_type(
        "email address", "invalid-email.ca"
    )


def test_validation_email_sent_successfully():
    """Test for ensuring that an email is sent to a valid email address"""
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        result = run(
            """
            {
                sendValidationEmail(email: "testuser@testemail.ca") {
                    content{
                        body
                    }
                    template{
                        id
                    }
                }
            }
            """,
        )
        assert result["data"]
        assert result["data"]["sendValidationEmail"]
        assert result["data"]["sendValidationEmail"]["content"]
        assert result["data"]["sendValidationEmail"]["content"]["body"]
        assert result["data"]["sendValidationEmail"]["template"]
        assert result["data"]["sendValidationEmail"]["template"]["id"]

        # Checks that the correct user name is sent.
        assert (
            "Hello testuser,"
            in result["data"]["sendValidationEmail"]["content"]["body"]
        )

        # Checks that the correct URL is sent
        assert (
            request_headers["Origin"]
            in result["data"]["sendValidationEmail"]["content"]["body"]
        )
        assert str(
            request_headers["Origin"] + "/verify-email/"
            in result["data"]["sendValidationEmail"]["content"]["body"]
        )

        # Checks that the correct template is sent.
        assert (
            result["data"]["sendValidationEmail"]["template"]["id"]
            == email_verification_template()
        )


def test_validation_email_invalid_email():
    """Tests to ensure that an invalid email address will raise an error"""
    result = run(
        """
        {
            sendValidationEmail(email: "invalid-email.ca"){
                id
            }
        }
        """,
    )
    assert result["errors"]
    assert result["errors"][0]
    assert result["errors"][0]["message"] == scalar_error_type(
        "email address", "invalid-email.ca"
    )
