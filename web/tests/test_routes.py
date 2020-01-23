import pytest

from track import create_app


@pytest.fixture()
def test_client():
	flask_app = create_app('testing')

	testing_client = flask_app.test_client()

	ctx = flask_app.app_context()
	ctx.push()

	yield testing_client  # this is where the testing happens!

	ctx.pop()


class TestValidRoutes:

	def test_health_check(self, test_client):
		response = test_client.get('/ping')
		assert response.status_code == 200
		assert b'PONG' in response.data

	def test_index(self, test_client):
		response = test_client.get('/en/index/')
		print(response.data)
		assert response.status_code == 200

	def test_index_fr(self, test_client):
		response = test_client.get('/fr/index/')
		print(response.data)
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
