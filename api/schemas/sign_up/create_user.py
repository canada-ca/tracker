import os

from graphql import GraphQLError
from requests import HTTPError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from functions.input_validators import *
from functions.error_messages import *
from models import Users as User
from db import db_session
from json_web_token import tokenize
from functions.verification_email import send_verification_email


def create_user(**kwargs):
    """
    This function creates and inserts a new user into the database. It includes appropriate error checking to ensure
    that the API is managed properly.
    :param kwargs: Various arguments passed into resolver.
    :return user: User is the newly inserted User Object that was pushed into the DB
    """
    display_name = cleanse_input(kwargs.get("display_name"))
    password = cleanse_input(kwargs.get("password"))
    confirm_password = cleanse_input(kwargs.get("confirm_password"))
    user_name = cleanse_input(kwargs.get("user_name"))
    preferred_lang = cleanse_input(kwargs.get("preferred_lang"))

    if not is_strong_password(password):
        logger.warning(
            f"User: {user_name} tried to sign up but password did not meet requirements."
        )
        raise GraphQLError(error_password_does_not_meet_requirements())

    if password != confirm_password:
        logger.warning(
            f"User: {user_name} tried to sign up but passwords were not matching."
        )
        raise GraphQLError(error_passwords_do_not_match())

    user = User.find_by_user_name(user_name)

    if user is None:
        user = User(
            user_name=user_name,
            display_name=display_name,
            preferred_lang=preferred_lang,
            password=password,
        )
        db_session.add(user)

        try:
            # Add User to db
            db_session.commit()

            email_response = send_verification_email(
                user=user,
                client=NotificationsAPIClient(
                    api_key=os.getenv("NOTIFICATION_API_KEY"),
                    base_url=os.getenv("NOTIFICATION_API_URL"),
                ),
            )

            if email_response.__contains__("Email Send Error"):
                logger.warning(
                    f"User: {user.id} tried to send verification email, but error occurred {email_response}"
                )
                raise GraphQLError(
                    "Error, when sending verification email, please try go to "
                    "user page to verify account"
                )

            # Get user id

            auth_token = tokenize(parameters={"user_id": user.id})

            logger.info(f"Successfully created new user: {user.id}")
            return {"auth_token": auth_token, "user": user}

        except HTTPError as e:
            logger.error(
                f"Tried to send verification email for {user.id} but error occured: {str(e)}"
            )
            raise GraphQLError(
                "Error, when sending verification email, please try go to "
                "user page to verify account"
            )

        except Exception as e:
            db_session.rollback()
            db_session.flush()
            logger.error(
                f"Error occurred when adding new user {user_name} to database: {str(e)}"
            )
            raise GraphQLError(error_creating_account())

    else:
        logger.warning(
            f"User tried to sign up using: {user_name} but account already exists {user.id}"
        )
        # Ensure that users have unique email addresses
        raise GraphQLError(error_email_in_use())
