import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pyotp
import pytest
from flask_bcrypt import Bcrypt
from graphene.test import Client


# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from manage import seed, remove_seed
seed()
from db import *
from app import app
from queries import schema
from models import Users
from backend.security_check import SecurityAnalysisBackend
from functions.error_messages import(
    error_invalid_credentials
)
remove_seed()


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
        )
        db.session.add(test_user)
        db.session.commit()

    yield

    with app.app_context():
        Users.query.delete()
        db.session.commit()


##
# This class of tests works within the 'createUser' api endpoint
@pytest.mark.usefixtures('user_schema_test_db_init')
class TestSignInUser:
    def test_successful_sign_in(self):
        """Test that ensures a user can be signed in"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"testuser@testemail.ca", password:"testpassword123"){
                        user{
                            userName
                        }
                    }
                }
                ''', backend=backend)
            assert executed['data']
            assert executed['data']['signIn']
            assert executed['data']['signIn']['user']
            assert executed['data']['signIn']['user']['userName'] == "testuser@testemail.ca"

    def test_invalid_credentials(self):
        """Test that ensures a user can be signed in"""
        with app.app_context():
            backend = SecurityAnalysisBackend()
            client = Client(schema)
            executed = client.execute(
                '''
                mutation{
                    signIn(userName:"testuser@testemail.ca", password:"testpassword1234"){
                        user{
                            userName
                        }
                    }
                }
                ''', backend=backend)
            assert executed['errors']
            assert executed['errors'][0]
            assert executed['errors'][0]['message']
            assert executed['errors'][0]['message'] == error_invalid_credentials()


