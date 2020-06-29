import os
import graphene
import jwt

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.input_validators import cleanse_input
from models.Users import Users


class EmailVerifyAccountInput(graphene.InputObjectType):
    """
    Input object with the various fields required for the EmailVerifyAccount
    mutation
    """

    token_string = graphene.String(
        description="Token in sent via email, and located in url", required=True
    )


class EmailVerifyAccount(graphene.Mutation):
    """
    Mutation that allows the user to verify their account through a token
    sent in an email
    """

    class Arguments:
        input = EmailVerifyAccountInput(
            required=True,
            description="Input object containing various fields required for"
            " emailVerifyAccount mutation.",
        )

    status = graphene.Boolean(
        description="Informs user if account was successfully verified."
    )

    @staticmethod
    def mutate(self, info, **kwargs):
        token_string = cleanse_input(kwargs.get("input", {}).get("token_string"))

        try:
            payload = jwt.decode(
                token_string, os.getenv("SUPER_SECRET_SALT"), algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise GraphQLError(
                "Signature expired, please send new verification email and try again."
            )
        except jwt.InvalidTokenError:
            raise GraphQLError("Invalid token, please try and verify again.")

        user_id = payload.get("user_id")

        # Check to see if user exists
        user = db_session.query(Users).filter(Users.id == user_id).first()

        if not user:
            logger.warning(
                f"User: {user_id} attempted to verify their account but it does not exist."
            )
            raise GraphQLError("Error, unable to verify account.")

        user.verify_account()

        try:
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            db_session.flush()
            logger.error(
                f"Database error occured when user: {user_id} attempted to verify their account, error: {str(e)}"
            )
            raise GraphQLError("Error, unable to verify account.")

        logger.info(f"User: {user_id} successfully verified their account.")
        return EmailVerifyAccount(status=True)
