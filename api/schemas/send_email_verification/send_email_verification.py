import graphene
import os

from graphql import GraphQLError
from notifications_python_client.notifications import NotificationsAPIClient

from db import db_session
from functions.input_validators import cleanse_input
from functions.verification_email import send_verification_email
from models.Users import Users
from scalars.email_address import EmailAddress


class SendEmailVerification(graphene.Mutation):
    """
    This mutation is used for re-sending a verification email if it failed
    during user creation
    """

    class Arguments:
        user_name = EmailAddress(
            description="The users email address used for sending email", required=True,
        )

    status = graphene.Boolean(
        description="If email is successfully sent status will be true"
    )

    @staticmethod
    def mutate(self, info, **kwargs):
        # Get information from mutation arguments
        user_name = cleanse_input(kwargs.get("user_name"))

        # Find user
        user = db_session.query(Users).filter(Users.user_name == user_name).first()

        # Check to see if user is found, or if they are already validated
        if user is None:
            raise GraphQLError("Error, cannot find user.")
        elif user.email_validated:
            raise GraphQLError("Error, user is already validated.")

        # Send validation email
        email_status = send_verification_email(
            user=user,
            client=NotificationsAPIClient(
                api_key=os.getenv("NOTIFICATION_API_KEY"),
                base_url=os.getenv("NOTIFICATION_API_URL"),
            )
        )

        if email_status.__contains__("Email Send Error"):
            raise GraphQLError(
                "Error, when sending verification email, please try again."
            )

        return SendEmailVerification(status=True)
