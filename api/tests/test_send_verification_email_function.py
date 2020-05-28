import os
import pytest_mock

from notifications_python_client import NotificationsAPIClient

from app import app
from models.Users import Users
from functions.verification_email import send_verification_email

NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY")
NOTIFICATION_API_URL = os.getenv("NOTIFICATION_API_URL")


def test_successful_send_verification_email(mocker):
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="delivered"
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="successful.send.email@test.com", password="testpassword123",
        )
        response = send_verification_email(
            user=temp_user,
            client=NotificationsAPIClient(
                api_key=NOTIFICATION_API_KEY,
                base_url=NOTIFICATION_API_URL,
            )
        )
        assert response == "delivered"


def test_permanent_failure_send_verification_email(mocker):
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="Email Send Error: permanent-failure"
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="perm-fail@simulator.notify", password="testpassword123",
        )
        response = send_verification_email(
            user=temp_user,
            client=NotificationsAPIClient(
                api_key=NOTIFICATION_API_KEY,
                base_url=NOTIFICATION_API_URL,
            )
        )
        assert response == "Email Send Error: permanent-failure"


def test_temporary_failure_send_verification_email(mocker):
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="Email Send Error: temporary-failure"
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        temp_user = Users(
            user_name="temp-fail@simulator.notify", password="testpassword123",
        )
        response = send_verification_email(
            user=temp_user,
            client=NotificationsAPIClient(
                api_key=NOTIFICATION_API_KEY,
                base_url=NOTIFICATION_API_URL,
            )
        )
        assert response == "Email Send Error: temporary-failure"
