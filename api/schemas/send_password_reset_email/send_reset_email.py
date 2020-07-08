from flask import request
from graphql import GraphQLError

from app import logger
from json_web_token import tokenize


def send_password_reset_email(user, client):
    """
    This function handles the work for sending the email through notify.
    :param user: User orm object containing their information
    :param client: An instantiated NotificationsAPIClient object used for sending email
    :return: True, if email was sent
    :raises: GraphQL Error if there was an error when sending email
    """

    # Check users preferred lang is English or French
    if user.preferred_lang == "french":
        email_template_id = "11aef4a3-b1a3-42b9-8246-7a0aa2bfe805"
    else:
        email_template_id = "8c3d96cc-3cbe-4043-b157-4f4a2bbb57b1"

    # Token parameters
    parameters = {"user_id": user.id, "current_password": user.password}

    # Url Generation
    token = tokenize(parameters=parameters, exp_period=1)
    url = str(request.url_root) + "reset-password/" + str(token)

    # Try to send password reset email
    try:
        response = client.send_email_notification(
            email_address=user.user_name,
            template_id=email_template_id,
            personalisation={"user": user.display_name, "password_reset_url": url},
        )
        return True
    except Exception as e:
        logger.error(
            f"Error when sending email for password reset for this user: {user.id}, error: {str(e)}"
        )
        raise GraphQLError("Error, please try sending password reset email again.")
