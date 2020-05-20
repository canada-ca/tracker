from graphql import GraphQLError

from functions.input_validators import *
from functions.error_messages import *
from models import Users as User
from db import db_session
from json_web_token import tokenize


def create_user(display_name, password, confirm_password, user_name, preferred_lang):
    """
    This function creates and inserts a new user into the database. It includes appropriate error checking to ensure
    that the API is managed properly.
    :param display_name: The users display name.
    :param user_name: The username for the new user.
    :param password: The password for the new user.
    :param confirm_password: Password confirmation for the new user -- Must be identical to password.
    :param user_name: The email address to be associated with the new user -- Must be unique for every user.
    :param preferred_lang: The users preferred language
    :return user: User is the newly inserted User Object that was pushed into the DB
    """
    display_name = cleanse_input(display_name)
    password = cleanse_input(password)
    confirm_password = cleanse_input(confirm_password)
    user_name = cleanse_input(user_name)
    preferred_lang = cleanse_input(preferred_lang)

    if not is_strong_password(password):
        raise GraphQLError(error_password_does_not_meet_requirements())

    if password != confirm_password:
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
            db_session.commit()
            auth_token = tokenize(user_id=user.id)
            return {"auth_token": auth_token, "user": user}
        except Exception as e:
            db_session.rollback()
            db_session.flush()
            raise GraphQLError(error_creating_account())
    else:
        # Ensure that users have unique email addresses
        raise GraphQLError(error_email_in_use())
