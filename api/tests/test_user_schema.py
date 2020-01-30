import pytest
from graphene.test import Client

import sys
import os

# This is the only way I could get imports to work for unit testing.  TODO: See if there is a better way!
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))
from app import schema
from functions.error_messages import *


##
# This class of tests handle any api calls that have to do with user passwords.

class TestUserSchemaPassword:

	def test_password_too_short(self):
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

	def test_passwords_do_not_match(self):
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

	def test_updated_passwords_do_not_match(self):
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

	def test_updated_password_too_short(self):
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

	def test_updated_password_no_user_email(self):
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
		assert executed['errors'][0]['message'] == error_user_does_not_exist()

	def test_updated_password_no_user(self):
		client = Client(schema)
		executed = client.execute(
			'''
			mutation {
				updatePassword(email: "testing-fake-email-no-such-user@test.ca",
					password: "valid-password", confirmPassword: "valid-password") {
					user {
						username
					}
				}
			}
			''')

		assert executed['errors']
		assert executed['errors'][0]
		assert executed['errors'][0]['message'] == error_user_does_not_exist()

