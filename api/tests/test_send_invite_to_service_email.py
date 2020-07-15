import logging
import os
import pytest
import pytest_mock

from notifications_python_client.notifications import NotificationsAPIClient
from graphql import GraphQLError
from unittest.mock import MagicMock

from app import app
from models import Organizations
from schemas.invite_user_to_org.send_invite_to_service_email import (
    send_invite_to_service_email,
)

NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY")
NOTIFICATION_API_URL = os.getenv("NOTIFICATION_API_URL")


def test_un_successful_send_invite_to_service_email(caplog):
    """
    Test error message occurs when GraphQLError is raised
    """

    mock_client = NotificationsAPIClient(
        api_key=NOTIFICATION_API_KEY, base_url=NOTIFICATION_API_URL
    )

    mock_client.send_email_notification = MagicMock(side_effect=Exception("Error"))

    test_org = Organizations(
        name="test org one", slug="test-org-one", acronym="TEST-ORG-ONE"
    )

    user_name = "testuser@email.ca"

    caplog.set_level(logging.ERROR)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        with pytest.raises(
            GraphQLError, match="Error, please try and invite the user again."
        ):
            send_invite_to_service_email(
                client=mock_client,
                user_name=user_name,
                org=test_org,
                preferred_language="english",
                requested_role="user",
            )
    assert (
        f"Error when sending user: {user_name}'s invitation to create an account and to {test_org.id} notification email."
        in caplog.text
    )
