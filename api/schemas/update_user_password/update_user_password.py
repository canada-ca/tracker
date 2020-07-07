import os

import graphene
import jwt

from graphql import GraphQLError

from app import logger
from functions.input_validators import cleanse_input
from models import Users
from schemas.update_user_password.update_password import update_password


class UpdateUserPasswordInput(graphene.InputObjectType):
    """
    Input object containing all fields for the UpdateUserPassword mutation
    """

    reset_token = graphene.String(
        required=True,
        description="Reset token found in the url, which was sent to the users inbox, by the sendPasswordReset mutation.",
    )
    password = graphene.String(
        required=True, description="The new password the user wishes to change to."
    )
    confirm_password = graphene.String(
        required=True,
        description="A confirmation of the password field to ensure the user has entered the new password correctly.",
    )


class UpdateUserPassword(graphene.Mutation):
    """
    This mutation allows users to use a token sent to them by email to update
    their account password.
    """

    class Arguments:
        input = UpdateUserPasswordInput(
            required=True,
            description="An input object containing all fields for this mutation.",
        )

    successful_password_update = graphene.String(
        description="Informs the user if the password update was successful."
    )

    @staticmethod
    def mutate(self, info, **kwargs):
        """
        This mutation function allows the user to submit a password and a
        password confirmation that allow their password to be updated. This
        function will only return if the update was successful, otherwise
        it will fail out, which properly informs the user that an error
        occurred.
        :param self: None
        :param info: Request Information
        :param kwargs: Various arguments passed in from the user
        :return: UpdateUserPassword object with a message saying the update was successful
        """
        # Get arguments
        reset_token = cleanse_input(kwargs.get("input", {}).get("reset_token"))
        password = cleanse_input(kwargs.get("input", {}).get("password"))
        confirm_password = cleanse_input(
            kwargs.get("input", {}).get("confirm_password")
        )

        # Decode token, and handle token errors
        try:
            payload = jwt.decode(
                reset_token, os.getenv("SUPER_SECRET_SALT"), algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            logger.warning(f"User attempted to reset password, but token was expired.")
            raise GraphQLError(
                "Error, token has expired please request another password reset email."
            )
        except jwt.InvalidTokenError:
            logger.warning(
                f"User attempted to reset password, but the token was invalid."
            )
            raise GraphQLError(
                "Error, token has expired please request another password reset email."
            )

        # Get the id from the token payload
        user_id = payload.get("user_id")

        # Coming soon
        password_reset_code = payload.get("parameters", {}).get("password_reset_code")
        user_id = payload.get("parameters", {}).get("user_id")

        # Check to see if the token returned none
        if user_id is not None:
            # Find the user who is requesting a password reset
            user = Users.find_by_id(id=user_id)
            # Ensure that user exists
            if user is not None:
                # Dispatch password updating to update_password functions
                successful_update = update_password(
                    user=user,
                    password=password,
                    confirm_password=confirm_password,
                    password_reset_code=password_reset_code,
                )

                # Check to make sure that update_password was successful, and inform the user
                if successful_update is True:
                    return UpdateUserPassword(
                        status="Successfully updated user password, please sign in with new password."
                    )
            else:
                logger.warning(
                    f"User: {user_id} attempted to reset password, but there is no account affiliated with that id."
                )
                raise GraphQLError(
                    "Error, token has expired please request another password reset email."
                )
        else:
            logger.warning(
                f"A user attempted to change password but user id was not found in the reset token."
            )
            raise GraphQLError(
                "Error, token has expired please request another password reset email."
            )
