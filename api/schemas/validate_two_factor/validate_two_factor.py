import graphene

from schemas.user.user import User
from schemas.validate_two_factor.validate import validate_two_factor
from scalars.email_address import EmailAddress


class ValidateTwoFactor(graphene.Mutation):
    class Arguments:
        user_name = EmailAddress(required=True)
        otp_code = graphene.String(required=True)

    user = graphene.Field(lambda: User)

    @staticmethod
    def mutate(self, info, user_name, otp_code):
        user_to_rtn = validate_two_factor(user_name=user_name, otp_code=otp_code)
        return ValidateTwoFactor(user=user_to_rtn)
