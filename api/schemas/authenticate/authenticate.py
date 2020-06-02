import graphene

from functions.input_validators import cleanse_input
from schemas.shared_structures import AuthResult
from schemas.authenticate.sign_in_user import sign_in_user
from scalars.email_address import EmailAddress


class Authenticate(graphene.Mutation):
    """
    This mutation allows users to give their credentials and retrieve a token
    that gives them access to restricted content.
    """

    # Define mutation arguments
    class Arguments:
        user_name = EmailAddress(
            description="User email that they signed up with.", required=True,
        )
        password = graphene.String(description="Users password", required=True,)

    # Define mutation fields
    auth_result = graphene.Field(
        lambda: AuthResult, description="User info who just signed in, and their JWT"
    )

    # Define mutation functionality
    @staticmethod
    def mutate(self, info, **kwargs):
        # Get arguments
        user_name = cleanse_input(kwargs.get("user_name"))
        password = cleanse_input(kwargs.get("password"))

        # Create user and JWT
        user_info = sign_in_user(user_name=user_name, password=password)

        # Return information to user
        return Authenticate(
            AuthResult(str(user_info.get("auth_token")), user_info.get("user"))
        )
