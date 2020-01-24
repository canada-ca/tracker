import pytest

from track import create_app

from track.error_messages import *


@pytest.fixture()
def test_client():
	flask_app = create_app('testing')

	testing_client = flask_app.test_client()

	ctx = flask_app.app_context()
	ctx.push()

	yield testing_client  # this is where the testing happens!

	ctx.pop()


class TestRegisterRoutes:

	# Tests that a weak password is rejected and an appropriate error message is displayed

	def test_weak_password(self, test_client):
		# Create a dict for the POST parameters
		params = dict(
			name_input='Test Name',
			email_input='test@test.ca',
			password_input='password',
			password_confirm_input='password'
		)

		response = test_client.post('/en/register', data=params, follow_redirects=True)

		# Determine which error message should be expected by calling the appropriate error message handler and parsing
		error_msg = password_weak_register(params['name_input'], params['email_input'])['error'].encode('UTF-8')
		assert response.status_code == 200
		assert error_msg in response.data

	# Tests that mismatched passwords are rejected and that an appropriate error message is displayed

	def test_mismatched_passwords(self, test_client):
		# Create a dict for the POST parameters
		params = dict(
			name_input='Test Name',
			email_input='test@test.ca',
			password_input='Password123!',
			password_confirm_input='DiffPassword123!'
		)

		response = test_client.post('/en/register', data=params, follow_redirects=True)

		# Determine which error message should be expected by calling the appropriate error message handler and parsing
		error_msg = password_not_match_register(params['name_input'], params['email_input'])['error'].encode('UTF-8')
		assert response.status_code == 200
		assert error_msg in response.data


class TestValidRoutes:

	def test_health_check(self, test_client):
		response = test_client.get('/ping')
		assert response.status_code == 200
		assert b'PONG' in response.data

	def test_index(self, test_client):
		response = test_client.get('/en/index/')
		assert response.status_code == 200

	def test_index_fr(self, test_client):
		response = test_client.get('/fr/index/')
		assert response.status_code == 200


class TestErrorStatusRoutes:

	# These test check that pages that require a login give a 401 (Unauthorized) error when accessed

	def test_invalid_access_to_logout(self, test_client):
		response = test_client.get('/en/logout')
		assert response.status_code == 401

	def test_invalid_access_to_user_profile(self, test_client):
		response = test_client.get('/en/user-profile')
		assert response.status_code == 401

	# This test checks 404 error handling

	def test_page_not_found(self, test_client):
		response = test_client.get('/en/a-very-fake-page')
		assert response.status_code == 404
