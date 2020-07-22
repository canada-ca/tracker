import jwt
import os

from graphql import GraphQLError
from requests import HTTPError
from notifications_python_client.notifications import NotificationsAPIClient

from app import logger
from functions.input_validators import *
from functions.error_messages import *
from models import Organizations, Users as User, User_affiliations
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
    user_name = cleanse_input(kwargs.get("user_name")).lower()
    preferred_lang = cleanse_input(kwargs.get("preferred_lang"))
    sign_up_token = cleanse_input(kwargs.get("sign_up_token"))

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

        if sign_up_token != "":
            # Decode token, and handle token errors
            try:
                payload = jwt.decode(
                    sign_up_token, os.getenv("SUPER_SECRET_SALT"), algorithms=["HS256"]
                )
            except jwt.ExpiredSignatureError:
                logger.warning(
                    f"User attempted to sign up with a token, but token was expired."
                )
                raise GraphQLError(
                    "Error, token has expired please request another invite to org email."
                )
            except jwt.InvalidTokenError:
                logger.warning(
                    f"User attempted to sign up with a token, but the token was invalid."
                )
                raise GraphQLError(
                    "Error, token has expired please request another invite to org email."
                )

            # Get Values from token
            user_name = payload.get("parameters", {}).get("user_name")
            org_id = payload.get("parameters", {}).get("org_id")
            requested_level = payload.get("parameters", {}).get("requested_level")

            # Create User Affiliation
            if (
                user_name is not None
                and org_id is not None
                and requested_level is not None
            ):
                org = (
                    db_session.query(Organizations)
                    .filter(Organizations.id == org_id)
                    .first()
                )
                user_affiliation = User_affiliations(
                    permission=requested_level,
                    organization_id=org.id,
                    user_organization=org,
                    user_id=user.id,
                    user=user,
                )
                db_session.add(user_affiliation)
                logger.info(
                    f"Successfully created affiliation for {user.user_name} to {org.id}."
                )
            else:
                logging_str = ""
                if user_name is None:
                    logging_str += " user_name"
                if org_id is None:
                    logging_str += " org_id"
                if requested_level is None:
                    logging_str += " requested_level"
                logger.warning(
                    f"User: {user.user_name} attempted to sign up with an invite token but{logging_str} field(s) were missing."
                )
                raise GraphQLError(
                    "Error, please request a new invite email from the organization admin."
                )

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
