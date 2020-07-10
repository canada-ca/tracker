import graphene

from enums.languages import LanguageEnums
from functions.input_validators import cleanse_input
from scalars.email_address import EmailAddress
from schemas.shared_structures import AuthResult
from schemas.sign_up.create_user import create_user


class SignUpInput(graphene.InputObjectType):
    """

    """

    display_name = graphene.String(
        description="The name that will be displayed to other users.", required=True,
    )
    user_name = EmailAddress(
        description="Email address that the user will use to authenticate with.",
        required=True,
    )
    password = graphene.String(
        description="The password the user will authenticate with.", required=True,
    )
    confirm_password = graphene.String(
        description="A confirmation that the user submitted the correct password.",
        required=True,
    )
    preferred_lang = LanguageEnums(
        description="Used to set users preferred language", required=True,
    )
    sign_up_token = graphene.String(
        description="A token sent by email, that will assign a user to an organization with a pre-determined role.",
        required=False,
    )


class SignUp(graphene.Mutation):
    """
    This method allows for new users to sign up for our sites services.
    """

    # Define mutation arguments
    class Arguments:
        input = SignUpInput(required=True, description="")

    # Define mutation fields
    auth_result = graphene.Field(
        lambda: AuthResult, description="Users information, and JWT",
    )

    # Define mutation functionality
    @staticmethod
    def mutate(self, info, **kwargs):
        # Get arguments
        user_name = cleanse_input(kwargs.get("input", {}).get("user_name"))
        display_name = cleanse_input(kwargs.get("input", {}).get("display_name"))
        password = cleanse_input(kwargs.get("input", {}).get("password"))
        confirm_password = cleanse_input(
            kwargs.get("input", {}).get("confirm_password")
        )
        preferred_lang = cleanse_input(kwargs.get("input", {}).get("preferred_lang"))
        sign_up_token = cleanse_input(kwargs.get("input", {}).get("sign_up_token"))

        # Create user and JWT
        user_info = create_user(
            user_name=user_name,
            display_name=display_name,
            password=password,
            confirm_password=confirm_password,
            preferred_lang=preferred_lang,
            sign_up_token=sign_up_token,
        )

        # Return information to user
        return SignUp(
            AuthResult(str(user_info.get("auth_token")), user_info.get("user"))
        )
