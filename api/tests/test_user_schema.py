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


class TestCreateUser:

    def test_email_address_in_use(self, setup_empty_db_with_user):
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


##
# This class of tests handle any api calls that have to do with user passwords.
class TestUserSchemaPassword:

    def test_password_too_short(self, setup_db):
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

    def test_updated_passwords_do_not_match(self, setup_db):
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
