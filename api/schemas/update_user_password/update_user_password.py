import graphene

from schemas.update_user_password.update_password import update_password
from schemas.User.user import User
from scalars.email_address import EmailAddress


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
