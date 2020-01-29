import pytest
from graphene.test import Client

import sys
import os

# This is the only way I could get imports to work for unit testing.  TODO: See if there is a better way!
PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))
from app import schema


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

		assert executed['errors'][0]['message']\
			== "Password does not meet minimum requirements (Min. 8 chars, Uppercase, Number, Special Char)"
