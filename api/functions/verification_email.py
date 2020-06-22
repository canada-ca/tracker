from flask import request
from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from json_web_token import tokenize
from models import Users


def get_verification_email_status(notify_client, response):
    try:
        email_status = notify_client.get_notification_by_id(response.get("id")).get(
            "status"
        )
        return email_status

    except Exception as e:
        logger.error(f"Error when retrieving email status: {str(e)}")
        return "Error, when sending verification email, please try again."


def send_verification_email(user: Users, client: NotificationsAPIClient):
    """
    This function allows a user object to be passed in during account creation
    and send an email to be used for verifying accounts
    :param user: A instance of /models/User.py
    :param client: An instance of NotificationsAPIClient
    :return: None
    """
    # Create Notify Client
    notify_client = client

    # Check to see if users preferred lang is English or French
    if user.preferred_lang == "french":
        email_template_id = "f2c9b64a-c754-4ffd-93e9-33fdb0b5ae0b"
    else:
        email_template_id = "6e3368a7-0d75-47b1-b4b2-878234e554c9"

    # URL Generation
    token = tokenize(user_id=user.id, exp_period=24)
    url = str(request.url_root) + "validate/" + str(token)

    # Send Email
    try:
        response = notify_client.send_email_notification(
            email_address=user.user_name,
            template_id=email_template_id,
            personalisation={"user": user.display_name, "verify_email_url": url},
        )

    except Exception as e:
        logger.error(
            f"Error when sending user: {user.id}'s verification email: {str(e)}"
        )
        raise GraphQLError("Error, when sending verification email, please try again.")

    # Check Email status
    email_status = get_verification_email_status(
        notify_client=notify_client, response=response,
    )

    if (
        email_status == "permanent-failure"
        or email_status == "temporary-failure"
        or email_status == "technical-failure"
    ):
        logger.warning(
            f"{email_status} occurred when attempting to send {user.id}'s verification email."
        )
        raise GraphQLError("Error, when sending verification email, please try again.")
    else:
        logger.info(f"User: {user.id} successfully sent verification email.")
        return email_status
