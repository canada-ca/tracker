from flask import request
from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from json_web_token import tokenize


def send_invite_to_service_email(
    client: NotificationsAPIClient, user_name, org, preferred_language, requested_role
):
    """

    :param client:
    :param user_name:
    :param org:
    :param preferred_language:
    :param requested_role:
    :return:
    """

    # Check to see if users preferred lang is English or French
    if preferred_language == "french":
        email_template_id = "3c10d11b-f502-439d-bca1-afa551012310"
    else:
        email_template_id = "e66e1a68-8041-40be-af0e-83d064965431"

    organization = org.name if org.name != "" else "Organization"

    # Token parameters
    parameters = {
        "user_name": user_name,
        "org_id": org.id,
        "requested_level": requested_role,
    }

    # Create invite to service link
    token = tokenize(parameters=parameters, exp_period=24)
    url = str(request.url_root) + "create-user/" + str(token)

    # Send Email
    try:
        response = client.send_email_notification(
            email_address=user_name,
            template_id=email_template_id,
            personalisation={
                "display_name": user_name,
                "organization_name": organization,
                "create_account_link": url,
            },
        )
    except Exception as e:
        logger.error(
            f"Error when sending user: {user_name}'s invitation to create an account and to {org_name} notification email."
        )
        raise GraphQLError("Error, please try and invite the user again.")
