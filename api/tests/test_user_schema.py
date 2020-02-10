import sys
import os
from os.path import dirname, join, expanduser, normpath, realpath

import pytest
from graphene.test import Client
from functions.error_messages import *

# This is the only way I could get imports to work for unit testing.
PACKAGE_PARENT = '..'
SCRIPT_DIR = dirname(realpath(join(os.getcwd(), expanduser(__file__))))
sys.path.append(normpath(join(SCRIPT_DIR, PACKAGE_PARENT)))

from db import *
from app import app
from app import schema


@pytest.fixture()
def setup_db():
	db.init_app(app)


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


