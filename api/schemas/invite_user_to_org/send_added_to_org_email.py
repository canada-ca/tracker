from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from models import Users


def send_invite_notification_email(
    client: NotificationsAPIClient, user: Users, org_name
):
    """

    :param client:
    :param user:
    :return:
    """

    # Check to see if users preferred lang is English or French
    if user.preferred_lang == "french":
        email_template_id = "a6eb3fdd-c7ab-4404-af04-316abd2fb221"
    else:
        email_template_id = "eccc6a60-44e8-40ff-8b15-ed82155b769f"

    display_name = user.display_name if user.display_name != "" else "User"
    organization = org_name if org_name != "" else "Organization"

    # Send Email
    try:
        response = client.send_email_notification(
            email_address=user.user_name,
            template_id=email_template_id,
            personalisation={
                "display_name": display_name,
                "organization_name": organization,
            },
        )
    except Exception as e:
        logger.error(
            f"Error when sending user: {user.id}'s invitation to {org_name} notification email."
        )
        raise GraphQLError("Error, please try and invite the user again.")
