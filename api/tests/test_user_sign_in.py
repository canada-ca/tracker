import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath
import datetime

import pyotp
import pytest
from flask_bcrypt import Bcrypt
from graphene.test import Client


# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db import db
from app import app
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend
from functions.error_messages import(
    error_invalid_credentials,
    error_too_many_failed_login_attempts,
    error_user_does_not_exist
)


@pytest.fixture(scope='class')
def user_schema_test_db_init():
    db.init_app(app)
    bcrypt = Bcrypt(app)

    with app.app_context():
        test_user = Users(
            display_name="testuser",
            user_name="testuser@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
            failed_login_attempt_time=datetime.datetime.now().timestamp() + 1920, # This mocks that the user is accessing the service 32 mins after their last failed login attempt
        )
        db.session.add(test_user)

        test_already_failed_user = Users(
            display_name="test_failed_user",
            user_name="test_already_failed_user@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
            failed_login_attempts=3,
            failed_login_attempt_time=datetime.datetime.now().timestamp() + 1920, # This mocks that the user is accessing the service 32 mins after their last failed login attempt
        )
        db.session.add(test_already_failed_user)

        test_too_many_failed_user = Users(
            display_name="test_too_many_fails_user",
            user_name="test_too_many_failed_user@testemail.ca",
            user_password=bcrypt.generate_password_hash(
                password="testpassword123").decode("UTF-8"),
            failed_login_attempts=30,
            failed_login_attempt_time=0,
        )
        db.session.add(test_too_many_failed_user)

        db.session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db.session.commit()


##
# This class of tests works within the 'signIn' api endpoint
@pytest.mark.usefixtures('user_schema_test_db_init')
class TestSignInUser:
    def test_successful_sign_in(self):
        """
        Test that ensures a user can be signed in successfully
        """
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"testuser@testemail.ca",
                            password:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                ''', backend=backend)
            assert executed['data']
            assert executed['data']['signIn']
            assert executed['data']['signIn']['user']
            assert executed['data']['signIn']['user']['userName'] \
                   == "testuser@testemail.ca"

    def test_invalid_credentials(self):
        """
        Test that ensures invalid credential errors are caught,
         and failed login attempts are incremented.
        """
        with app.app_context():
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"testuser@testemail.ca",
                            password:"testpassword1234"){
                        user{
                            userName
                        }
                    }
                }
                ''')
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message']
            assert executed['errors'][0]['message'] \
                   == error_invalid_credentials()

            failed_user = Users.query\
                .filter(Users.user_name == "testuser@testemail.ca").first()

            assert failed_user is not None
            assert failed_user.failed_login_attempts == 1
            assert failed_user.failed_login_attempt_time is not 0

    def test_successful_login_sets_failed_attempts_to_zero(self):
        """
        Test that ensures a user can be signed in, and that when they do, their
        user count is updated to be 0.
        """
        with app.app_context():
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"test_already_failed_user@testemail.ca",
                     password:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                ''')

            user = Users.query\
                .filter(Users.user_name ==
                        "test_already_failed_user@testemail.ca").first()

            assert user is not None
            assert user.failed_login_attempts == 0
            assert user.failed_login_attempt_time == 0

            assert executed['data']
            assert executed['data']['signIn']
            assert executed['data']['signIn']['user']['userName'] == "test_already_failed_user@testemail.ca"

    def test_too_many_failed_attempts(self):
        """Test that ensures a user can be signed in"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"test_too_many_failed_user@testemail.ca",
                     password:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                ''', backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message']
            assert executed['errors'][0]['message'] \
                   == error_too_many_failed_login_attempts()

    def test_no_such_user(self):
        """Test that ensures error message is sent if user does not exist"""
        with app.app_context():
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"nouser@testemail.ca",
                     password:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                ''')
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message']
            assert executed['errors'][0]['message'] == error_user_does_not_exist()
