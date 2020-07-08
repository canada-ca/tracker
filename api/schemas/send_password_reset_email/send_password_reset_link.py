import os

import graphene

from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from db import db_session
from functions.input_validators import cleanse_input
from models import Users
from scalars.email_address import EmailAddress
from schemas.send_password_reset_email.send_reset_email import send_password_reset_email


class SendPasswordResetLink(graphene.Mutation):
    """
    This mutation allows a user to provide their username and request that a
    password reset email be sent to their account with a reset token in a url.
    """

    class Arguments:
        user_name = EmailAddress(
            required=True,
            description="User name for the account you would like to receive a password reset link for.",
        )

    status = graphene.String()

    def mutate(self, info, **kwargs):
        """
        This mutation function allows the user to submit their username, and
        receive an email with a password reset link that allows them to reset
        their password.
        :param self: None
        :param info: Request Information
        :param kwargs: Various arguments passed in from the user
        :return: SendPasswordResetLink that is sent if user can or cannot be found
        """
        user_name = cleanse_input(kwargs.get("user_name"))

        # Safety check in case required check fails
        if user_name is None:
            logger.error(
                "User attempted to send a password reset email but did not provide an email."
            )
            raise GraphQLError("Error, unable to send password reset email.")

        # Check to see if username exists in db
        user_orm = Users.find_by_user_name(user_name=user_name)

        # If user orm exists send email
        if user_orm is not None:
            if (
                send_password_reset_email(
                    user=user_orm,
                    client=NotificationsAPIClient(
                        api_key=os.getenv("NOTIFICATION_API_KEY"),
                        base_url=os.getenv("NOTIFICATION_API_URL"),
                    ),
                )
                is True
            ):
                logger.info(
                    f"User: {user_orm.id}, successfully sent a password reset email."
                )
        else:
            logger.warning(
                f"A user attempted to send a password reset email for {user_name} but this user name is not affiliated with any account."
            )

        return SendPasswordResetLink(
            status="If an account with this username is found, a password reset link will be found in your inbox."
        )
