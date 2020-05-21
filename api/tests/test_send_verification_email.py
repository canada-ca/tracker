import pytest

from graphql import GraphQLError

from app import app
from models.Users import Users
from schemas.sign_up.send_verification_email import send_verification_email


def test_permanent_failure_send_verification_email():
    with pytest.raises(GraphQLError, match="Error, when sending verification email, please try signing up again"):
        request_headers = {"Origin": "https://testserver.com"}
        with app.test_request_context(headers=request_headers):
            temp_user = Users(
                user_name="perm-fail@simulator.notify",
                password="testpassword123",
            )
            send_verification_email(user=temp_user)
