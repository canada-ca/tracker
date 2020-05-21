import pytest

from graphql import GraphQLError

from app import app
from models.Users import Users
from schemas.sign_up.send_verification_email import send_verification_email


def test_successful_send_verification_email():
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="successful.send.email@test.com",
            password="testpassword123",
        )
        response = send_verification_email(user=temp_user)
        assert response == "delivered"


def test_permanent_failure_send_verification_email():
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="perm-fail@simulator.notify",
            password="testpassword123",
        )
        response = send_verification_email(user=temp_user)
        assert response == "Email Send Error: permanent-failure"


def test_temporary_failure_send_verification_email():
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="temp-fail@simulator.notify",
            password="testpassword123",
        )
        response = send_verification_email(user=temp_user)
        assert response == "Email Send Error: temporary-failure"

