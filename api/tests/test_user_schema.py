import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from flask_bcrypt import Bcrypt
from graphene.test import Client
from functions.error_messages import *

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db import *
from app import app
from queries import schema
from models import Users as User


@pytest.fixture()
def setup_db():
    db.init_app(app)


@pytest.fixture()
def setup_empty_db_with_user():
    db.init_app(app)
    with app.app_context():
        bcrypt = Bcrypt(app)

        if User.query.first() is None:
            # Insert a user into DB
            test_user = User(
                username="testuser",
                user_email="testuser@testemail.ca",
                user_password=bcrypt.generate_password_hash(password="testpassword123").decode("UTF-8"),

            )
            db.session.add(test_user)
            db.session.commit()

        yield

        # Delete all users after testing
        with app.app_context():
            User.query.delete()


##
# This class of tests works within the 'createUser' api endpoint
class TestCreateUser:

    def test_successful_creation(self, setup_empty_db_with_user):
        """Test that ensures a user can be created successfully using the api endpoint"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation{
                createUser(username:"user-test", email:"different-email@testemail.ca",
                    password:"testpassword123", confirmPassword:"testpassword123"){
                    user{
                        username
                        userEmail
                    }
                }
            }
            ''')
        assert executed['data']
        assert executed['data']['createUser']
        assert executed['data']['createUser']['user']
        assert executed['data']['createUser']['user']['username'] == "user-test"
        assert executed['data']['createUser']['user']['userEmail'] == "different-email@testemail.ca"

    def test_email_address_in_use(self, setup_empty_db_with_user):
        """Test that ensures each user has a unique email address"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation{
                createUser(username:"testuser", email:"testuser@testemail.ca",
                    password:"testpassword123", confirmPassword:"testpassword123"){
                    user{
                        username
                    }
                }
            }
            ''')
        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_email_in_use()

    def test_password_too_short(self, setup_db):
        """Test that ensure that a user's password meets the valid length requirements"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation{
                createUser(username:"testuser", email:"test@test-email.ca", password:"test", confirmPassword:"test"){
                    user{
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_password_does_not_meet_requirements()

    def test_passwords_do_not_match(self, setup_db):
        """Test to ensure that user password matches their password confirmation"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation{
                createUser(username:"testuser", email:"test@test-email.ca", password:"A-Val1d-Pa$$word",
                    confirmPassword:"also-A-Val1d-Pa$$word"){
                    user{
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_passwords_do_not_match()


##
# This class of tests works within the 'updatePassword' api endpoint
class TestUpdatePassword:

    def test_updated_passwords_do_not_match(self, setup_db):
        """Test to ensure that user's new password matches their password confirmation"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation {
                updatePassword(email: "test@test-email.ca", password: "a-super-long-password",
                    confirmPassword: "another-super-long-password") {
                    user {
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_passwords_do_not_match()

    def test_updated_password_too_short(self, setup_db):
        """Test that ensure that a user's password meets the valid length requirements"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation {
                updatePassword(email: "test@test-email.ca", password: "password", confirmPassword: "password") {
                    user {
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_password_does_not_meet_requirements()

    def test_updated_password_no_user_email(self, setup_db):
        """Test that ensures an empty string submitted as email will not be accepted"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation {
                updatePassword(email: "", password: "valid-password", confirmPassword: "valid-password") {
                    user {
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == scalar_error_type("email address", "")


##
# This class of tests works within the 'updatePassword' api endpoint
class TestValidateTwoFactor:

    def test_user_does_not_exist(self, setup_empty_db_with_user):
        """Test that an error is raised if the user specified does not exist"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation {
                authenticateTwoFactor(email: "anotheruser@testemail.ca", otpCode: "000000") {
                    user {
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_user_does_not_exist()

    def test_invalid_otp_code(self, setup_empty_db_with_user):
        """Test that an error is raised if the user specified does not exist"""
        client = Client(schema)
        executed = client.execute(
            '''
            mutation {
                authenticateTwoFactor(email: "testuser@testemail.ca", otpCode: "000000") {
                    user {
                        username
                    }
                }
            }
            ''')

        assert executed['errors']
        assert executed['errors'][0]
        assert executed['errors'][0]['message'] == error_otp_code_is_invalid()
