import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pyotp
import pytest
from flask_bcrypt import Bcrypt
from graphene.test import Client


# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = ".."
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from app import app
from db import db_session
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend
from functions.error_messages import *


@pytest.fixture(scope="class")
def user_schema_test_db_init():
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            display_name="testuser",
            user_name="testuser@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_user)
        test_admin = Users(
            display_name="testadmin",
            user_name="testadmin@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123"
            ).decode("UTF-8"),
        )
        db_session.add(test_admin)
        db_session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db_session.commit()


##
# This class of tests works within the 'createUser' api endpoint
@pytest.mark.usefixtures("user_schema_test_db_init")
class TestCreateUser:
    def test_successful_creation(self):
        """Test that ensures a user can be created successfully using the api endpoint"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                """
                mutation{
                    createUser(displayName:"user-test", userName:"different-email@testemail.ca",
                        password:"testpassword123", confirmPassword:"testpassword123"){
                        user{
                            userName
                            displayName
                        }
                    }
                }
                """,
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["createUser"]
            assert executed["data"]["createUser"]["user"]
            assert (
                executed["data"]["createUser"]["user"]["userName"]
                == "different-email@testemail.ca"
            )
            assert executed["data"]["createUser"]["user"]["displayName"] == "user-test"

    def test_email_address_in_use(self):
        """Test that ensures each user has a unique email address"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed_first = client.execute(
                """
                mutation{
                    createUser(displayName:"testuser", userName:"testuser@testemail.ca",
                        password:"testpassword123", confirmPassword:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                """,
                backend=backend,
            )
            executed = client.execute(
                """
                mutation{
                    createUser(displayName:"testuser", userName:"testuser@testemail.ca",
                        password:"testpassword123", confirmPassword:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                """,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == error_email_in_use()

    def test_password_too_short(self):
        """Test that ensure that a user's password meets the valid length requirements"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            mutation{
                createUser(displayName:"testuser", userName:"test@test-email.ca", password:"test", confirmPassword:"test"){
                    user{
                        userName
                    }
                }
            }
            """,
            backend=backend,
        )

        assert executed["errors"]
        assert executed["errors"][0]
        assert (
            executed["errors"][0]["message"]
            == error_password_does_not_meet_requirements()
        )

    def test_passwords_do_not_match(self):
        """Test to ensure that user password matches their password confirmation"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            mutation{
                createUser(displayName:"testuser", userName:"test@test-email.ca", password:"A-Val1d-Pa$$word",
                    confirmPassword:"also-A-Val1d-Pa$$word"){
                    user{
                        userName
                    }
                }
            }
            """,
            backend=backend,
        )

        assert executed["errors"]
        assert executed["errors"][0]
        assert executed["errors"][0]["message"] == error_passwords_do_not_match()


##
# This class of tests works within the 'updatePassword' api endpoint
@pytest.mark.usefixtures("user_schema_test_db_init")
class TestUpdatePassword:
    def test_update_password_success(self):
        """Test to ensure that a user is returned when their password is updated successfully"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                """
                mutation {
                    updatePassword(userName: "testuser@testemail.ca", password: "another-super-long-password",
                        confirmPassword: "another-super-long-password") {
                        user {
                            userName
                            displayName
                        }
                    }
                }
                """,
                backend=backend,
            )

            assert executed["data"]
            assert executed["data"]["updatePassword"]
            assert executed["data"]["updatePassword"]["user"]
            assert (
                executed["data"]["updatePassword"]["user"]["userName"]
                == "testuser@testemail.ca"
            )
            assert (
                executed["data"]["updatePassword"]["user"]["displayName"] == "testuser"
            )

    def test_updated_passwords_do_not_match(self):
        """Test to ensure that user's new password matches their password confirmation"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            mutation {
                updatePassword(userName: "test@test-email.ca", password: "a-super-long-password",
                    confirmPassword: "another-super-long-password") {
                    user {
                        userName
                    }
                }
            }
            """,
            backend=backend,
        )

        assert executed["errors"]
        assert executed["errors"][0]
        assert executed["errors"][0]["message"] == error_passwords_do_not_match()

    def test_updated_password_too_short(self):
        """Test that ensure that a user's password meets the valid length requirements"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            mutation {
                updatePassword(userName: "test@test-email.ca", password: "password", confirmPassword: "password") {
                    user {
                        userName
                    }
                }
            }
            """,
            backend=backend,
        )

        assert executed["errors"]
        assert executed["errors"][0]
        assert (
            executed["errors"][0]["message"]
            == error_password_does_not_meet_requirements()
        )

    def test_updated_password_no_user_email(self):
        """Test that ensures an empty string submitted as email will not be accepted"""
        backend = SecurityAnalysisBackend()
        client = Client(schema)
        executed = client.execute(
            """
            mutation {
                updatePassword(userName: "", password: "valid-password", confirmPassword: "valid-password") {
                    user {
                        userName
                    }
                }
            }
            """,
            backend=backend,
        )

        assert executed["errors"]
        assert executed["errors"][0]
        assert executed["errors"][0]["message"] == scalar_error_type(
            "email address", ""
        )


##
# This class of tests works within the 'authenticateTwoFactor' api endpoint
@pytest.mark.usefixtures("user_schema_test_db_init")
class TestValidateTwoFactor:
    def test_successful_validation(self):
        """Test that ensures a validation is successful when all params are proper"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            totp = pyotp.TOTP("base32secret3232")
            otp_code = (
                totp.now()
            )  # Generates a code that is valid for 30s. Plenty of time to execute the query

            client = Client(schema)
            executed = client.execute(
                '''
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
                backend=backend,
            )
            assert executed["data"]
            assert executed["data"]["authenticateTwoFactor"]
            assert executed["data"]["authenticateTwoFactor"]["user"]
            assert (
                executed["data"]["authenticateTwoFactor"]["user"]["userName"]
                == "testuser@testemail.ca"
            )

    def test_user_does_not_exist(self):
        """Test that an error is raised if the user specified does not exist"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                """
                mutation {
                    authenticateTwoFactor(userName: "anotheruser@testemail.ca", otpCode: "000000") {
                        user {
                            userName
                        }
                    }
                }
                """,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == error_user_does_not_exist()

    def test_invalid_otp_code(self):
        """Test that an error is raised if the user specified does not exist"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                """
                mutation {
                    authenticateTwoFactor(userName: "testuser@testemail.ca", otpCode: "000000") {
                        user {
                            userName
                        }
                    }
                }
                """,
                backend=backend,
            )

            assert executed["errors"]
            assert executed["errors"][0]
            assert executed["errors"][0]["message"] == error_otp_code_is_invalid()
