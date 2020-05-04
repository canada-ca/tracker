import os
import sys
from os.path import dirname, join, expanduser, normpath, realpath

from graphene.test import Client

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = ".."
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from functions.email_templates import (
    email_verification_template,
    password_reset_template,
)
from functions.error_messages import scalar_error_type
from app import app

from queries import schema
from backend.security_check import SecurityAnalysisBackend


class TestPasswordReset:
    def test_email_sent_successfully(self):
        """Test for ensuring that an email is sent to a valid email address"""
        request_headers = {"Origin": "https://testserver.com"}
        with app.test_request_context(headers=request_headers):
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
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
                """,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["sendPasswordReset"]
            assert executed["data"]["sendPasswordReset"]["content"]
            assert executed["data"]["sendPasswordReset"]["content"]["body"]
            assert executed["data"]["sendPasswordReset"]["template"]
            assert executed["data"]["sendPasswordReset"]["template"]["id"]

            # Checks that the correct user name is sent.
            assert (
                "Hello testuser,"
                in executed["data"]["sendPasswordReset"]["content"]["body"]
            )

            # Checks that the correct URL is sent
            assert (
                request_headers["Origin"]
                in executed["data"]["sendPasswordReset"]["content"]["body"]
            )
            assert str(
                request_headers["Origin"] + "/reset-password/"
                in executed["data"]["sendPasswordReset"]["content"]["body"]
            )

            # Checks that the correct template is sent.
            assert (
                executed["data"]["sendPasswordReset"]["template"]["id"]
                == password_reset_template()
            )

    def test_invalid_email(self):
        """Tests to ensure that an invalid email address will raise an error"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            {
                sendPasswordReset(email: "invalid-email.ca") {
                        id
                    }
            }
            """,
            backend=backend,
        )
        assert executed["errors"]
        assert executed["errors"][0]
        assert executed["errors"][0]["message"] == scalar_error_type(
            "email address", "invalid-email.ca"
        )


class TestVerifyEmail:
    def test_email_sent_successfully(self):
        """Test for ensuring that an email is sent to a valid email address"""
        request_headers = {"Origin": "https://testserver.com"}
        with app.test_request_context(headers=request_headers):
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
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
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["sendValidationEmail"]
            assert executed["data"]["sendValidationEmail"]["content"]
            assert executed["data"]["sendValidationEmail"]["content"]["body"]
            assert executed["data"]["sendValidationEmail"]["template"]
            assert executed["data"]["sendValidationEmail"]["template"]["id"]

            # Checks that the correct user name is sent.
            assert (
                "Hello testuser,"
                in executed["data"]["sendValidationEmail"]["content"]["body"]
            )

            # Checks that the correct URL is sent
            assert (
                request_headers["Origin"]
                in executed["data"]["sendValidationEmail"]["content"]["body"]
            )
            assert str(
                request_headers["Origin"] + "/verify-email/"
                in executed["data"]["sendValidationEmail"]["content"]["body"]
            )

            # Checks that the correct template is sent.
            assert (
                executed["data"]["sendValidationEmail"]["template"]["id"]
                == email_verification_template()
            )

    def test_invalid_email(self):
        """Tests to ensure that an invalid email address will raise an error"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            {
                sendValidationEmail(email: "invalid-email.ca"){
                    id
                }
            }
            """,
            backend=backend,
        )
        assert executed["errors"]
        assert executed["errors"][0]
        assert executed["errors"][0]["message"] == scalar_error_type(
            "email address", "invalid-email.ca"
        )
