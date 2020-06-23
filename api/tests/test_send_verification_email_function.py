import logging
import os

import pytest
from graphql import GraphQLError
from notifications_python_client import NotificationsAPIClient
from requests import HTTPError
from unittest.mock import MagicMock

from app import app
from models.Users import Users
from functions.verification_email import send_verification_email

NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY")
NOTIFICATION_API_URL = os.getenv("NOTIFICATION_API_URL")


def test_successful_send_verification_email(mocker, caplog):
    """
    Test that a successful email verification is sent
    """
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="delivered",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        mock_client = NotificationsAPIClient(
            api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
        )

        mock_client.send_email_notification = MagicMock(return_value={})

        temp_user = Users(
            user_name="success@simulator.notify",
            password="testpassword123",
            display_name="test account",
        )
        caplog.set_level(logging.INFO)
        response = send_verification_email(user=temp_user, client=mock_client)

        assert response == "delivered"
        assert (
            f"User: {temp_user.id} successfully sent verification email." in caplog.text
        )


def test_permanent_failure_send_verification_email(mocker, caplog):
    """
    Test that error is raised when permanent-failure occurs
    """
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="permanent-failure",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        mock_client = NotificationsAPIClient(
            api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
        )

        mock_client.send_email_notification = MagicMock(return_value={})

        temp_user = Users(
            user_name="perm-fail@simulator.notify",
            password="testpassword123",
            display_name="test account",
        )
        caplog.set_level(logging.WARNING)
        response = send_verification_email(user=temp_user, client=mock_client)

    assert response == "Email Send Error: permanent-failure"
    assert (
        f"permanent-failure occurred when attempting to send {temp_user.id}'s verification email."
        in caplog.text
    )


def test_temporary_failure_send_verification_email(mocker, caplog):
    """
    Test that error is raised when temporary-failure occurs
    """
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="temporary-failure",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        mock_client = NotificationsAPIClient(
            api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
        )

        mock_client.send_email_notification = MagicMock(return_value={})

        request_headers = {"Origin": "https://testserver.com"}
        with app.test_request_context(headers=request_headers):
            mock_client = NotificationsAPIClient(
                api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
            )

            mock_client.send_email_notification = MagicMock(return_value={})

            temp_user = Users(
                user_name="temp-fail@simulator.notify",
                password="testpassword123",
                display_name="test account",
            )
            caplog.set_level(logging.WARNING)
            response = send_verification_email(user=temp_user, client=mock_client)

        assert response == "Email Send Error: temporary-failure"
        assert (
            f"temporary-failure occurred when attempting to send {temp_user.id}'s verification email."
            in caplog.text
        )


def test_technical_failure_send_verification_email(mocker, caplog):
    """
    Test that error is raised when technical-failure occurs
    """
    mocker.patch(
        "functions.verification_email.get_verification_email_status",
        autospec=True,
        return_value="technical-failure",
    )

    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        mock_client = NotificationsAPIClient(
            api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
        )

        mock_client.send_email_notification = MagicMock(return_value={})

        temp_user = Users(
            user_name="temp-fail@simulator.notify",
            password="testpassword123",
            display_name="test account",
        )
        caplog.set_level(logging.WARNING)
        response = send_verification_email(user=temp_user, client=mock_client)

        assert response == "Email Send Error: technical-failure"
        assert (
            f"technical-failure occurred when attempting to send {temp_user.id}'s verification email."
            in caplog.text
        )
