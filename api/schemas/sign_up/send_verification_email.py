import os
import time

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
    token = tokenize(user_id=user.user_name, exp_period=24)
    url = str(request.url_root) + "validate/" + str(token)

    # Send Email
    try:
        response = notify_client.send_email_notification(
            email_address=user.user_name,
            template_id=email_template_id,
            personalisation={
                "user": "",
                "verify_email_url": url
            }
        )

    except HTTPError:
        raise GraphQLError(
            "Error, when sending verification email, error: {}".format(HTTPError)
        )
    # XXX This is really not ideal, but using external services that send emails take time
    # Will revisit
    time.sleep(1)
    email_status = notify_client.get_notification_by_id(response.get("id")) \
        .get("status")

    if email_status == "permanent-failure" \
        or email_status == "temporary-failure" \
        or email_status == "technical-failure":
        response = "Email Send Error: {}".format(email_status)

    return response
