import logging
import os
import pytest
import pytest_mock

from notifications_python_client.notifications import NotificationsAPIClient
from graphql import GraphQLError
from unittest.mock import MagicMock

from app import app
from models import Organizations, Users
from schemas.invite_user_to_org.send_added_to_org_email import (
    send_invite_to_org_notification_email,
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

    user = Users(
        display_name="testadmin",
        user_name="testadmin@testemail.ca",
        password="testpassword123",
        preferred_lang="English",
        tfa_validated=False,
    )

    test_org = Organizations(
        name="test org one", slug="test-org-one", acronym="TEST-ORG-ONE"
    )

    caplog.set_level(logging.ERROR)
    request_headers = {"Origin": "https://testserver.com"}
    with app.test_request_context(headers=request_headers):
        with pytest.raises(
            GraphQLError, match="Error, please try and invite the user again."
        ):
            send_invite_to_org_notification_email(
                client=mock_client, user=user, org_name=test_org.name
            )

    assert (
        f"Error when sending user: {user.id}'s invitation to {test_org.name} notification email."
        in caplog.text
    )
