import graphene

from graphql import GraphQLError

from app import logger
from db import db_session
from enums.languages import LanguageEnums
from functions.auth_wrappers import require_token
from functions.input_validators import cleanse_input
from models import Users
from scalars.email_address import EmailAddress


class UpdateUserProfileInput(graphene.InputObjectType):
    """
    This input object contains various non-required fields for use when updating
    user profile information
    """

    display_name = graphene.String(
        required=False, description="The new display name the user wishes to change to."
    )
    user_name = EmailAddress(
        required=False, description="The new user name the user wishes to change to."
    )
    preferred_lang = LanguageEnums(
        required=False,
        description="The new preferred language the user wishes to change to.",
    )
    password = graphene.String(
        required=False, description="The new password the user wishes to change to."
    )
    confirm_password = graphene.String(
        required=False, description="A password confirmation of their new password."
    )


class UpdateUserProfile(graphene.Mutation):
    """
    A mutation that allows the user to update their user profile to change various
    details of their current profile.
    """

    class Arguments:
        input = UpdateUserProfileInput(
            required=True,
            description="Various input fields, used in the updateUserProfile mutation.",
        )

    status = graphene.String(
        description="The status if the user profile update was successful."
    )

    @require_token
    def mutate(self, info, **kwargs):
        """
        This function will take in various arguments, and update the various parts
        of the user profile if included in the arguments
        :param info: Request Information
        :param kwargs: Various arguments passed in from the user
        :return: UpdateUserProfile with status field set
        """
        user_id = kwargs.get("user_id")
        display_name = cleanse_input(kwargs.get("input", {}).get("display_name", ""))
        user_name = cleanse_input(kwargs.get("input", {}).get("user_name", ""))
        preferred_lang = cleanse_input(
            kwargs.get("input", {}).get("preferred_lang", "")
        )
        password = cleanse_input(kwargs.get("input", {}).get("password", ""))
        confirm_password = cleanse_input(
            kwargs.get("input", {}).get("confirm_password", "")
        )

        # Get Current User
        user = db_session.query(Users).filter(Users.id == user_id).first()

        logging_str = ""

        if display_name != "":
            user.display_name = display_name
            logging_str += " display_name,"

        if user_name != "":
            user.user_name = user_name
            logging_str += " user_name,"

        if preferred_lang != "":
            user.preferred_lang = preferred_lang
            logging_str += " preferred_lang,"

        if password != "" and confirm_password != "" and password == confirm_password:
            user.password = password
            logging_str += " password,"
        if password != "" and confirm_password != "" and password != confirm_password:
            logger.warning(
                f"User: {user_id} attempted to update their password, however they do not match."
            )
            raise GraphQLError(
                "Error, passwords do not match. Unable to update profile."
            )

        try:
            # db_session.add(user)
            db_session.commit()
            logger.info(
                f"User: {user_id} successfully updated{logging_str} of their user profile."
            )
            return UpdateUserProfile(status="Successfully updated account.")
        except Exception as e:
            logger.error(
                f"Error occurred when user: {user_id} tried updating their profile."
            )
            raise GraphQLError(
                "Error when updating user information, please try again."
            )
