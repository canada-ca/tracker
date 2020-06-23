import graphene

from schemas.sign_up.create_user import create_user
from functions.update_user_password import update_password
from functions.validate_two_factor import validate_two_factor

from scalars.email_address import EmailAddress

from schemas.User.user import User


class UpdateUserPassword(graphene.Mutation):
    class Arguments:
        password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)
        user_name = EmailAddress(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, password, confirm_password, user_name):
        user = update_password(
            user_name=user_name, password=password, confirm_password=confirm_password
        )
        return UpdateUserPassword(user=user)


class ValidateTwoFactor(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        otp_code = graphene.String(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, user_name, otp_code):
        user_to_rtn = validate_two_factor(user_name=user_name, otp_code=otp_code)
        return ValidateTwoFactor(user=user_to_rtn)
