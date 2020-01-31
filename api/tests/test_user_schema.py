import pytest
from graphene.test import Client

import sys
import os

# This is the only way I could get imports to work for unit testing.  TODO: See if there is a better way!
from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session


PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))
from app import schema
from functions.error_messages import *


@pytest.fixture()
def user_table():
	url = "postgresql+psycopg2://postgres:postgres@postgres:5432/auth"

	engine = create_engine(url, echo=True)
	connection = engine.connect()

	meta = MetaData()

	users = Table(
		'users', meta,
		Column('id', Integer, primary_key=True),
		Column('username', String),
		Column('display_name', String),
		Column('user_email', String),
		Column('user_password', String),
		Column('preferred_lang', String, default="English"),
		Column('failed_login_attempts', Integer, default=0),
	)

	meta.create_all(engine)

	# This fixture just needs to run to setup a postgres testing instance
	return connection


##
# This class of tests handle any api calls that have to do with user passwords.

class TestUserSchemaPassword:

	def test_password_too_short(self, user_table):
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

	def test_passwords_do_not_match(self, user_table):
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

	def test_updated_passwords_do_not_match(self, user_table):

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

	def test_updated_password_too_short(self, user_table):
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

	def test_updated_password_no_user_email(self, user_table):

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

	def test_updated_password_no_user(self, user_table):

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

