import os

from flask import request
from graphql import GraphQLError
from requests import HTTPError

from json_web_token import tokenize
from notifications_python_client.notifications import NotificationsAPIClient


def send_verification_email(user):
    """
    This function allows a user object to be passed in during account creation
    and send an email to be used for verifying accounts
    :param user: A instance of /models/User.py
    :return: None
    """
    # Create Notify Client
    notify_client = NotificationsAPIClient(
        api_key=os.getenv("NOTIFICATION_API_KEY"),
        base_url=os.getenv("NOTIFICATION_API_URL")
    )

    # Check to see if users preferred lang is English or French
    if user.preferred_lang == "french":
        email_template_id = "f2c9b64a-c754-4ffd-93e9-33fdb0b5ae0b"
    else:
        email_template_id = "6e3368a7-0d75-47b1-b4b2-878234e554c9"

    # URL Generation
    token = tokenize(user_id=user.id, exp_period=24)
    url = str(request.url_root) + "validate/" + str(token)

    # Send Email
    response = notify_client.send_email_notification(
        email_address=user.user_name,
        template_id=email_template_id,
        personalisation={
            "user": "",
            "verify_email_url": url
        }
    )

    if type(response) == HTTPError:
        raise GraphQLError(
            "Error, status code: {}, error: {}, error message: {}".format(
                response.status_code,
                response[0].get("error"),
                response[0].get("message")
            )
        )
