import graphene

from schemas.User.user import User


class AuthResult(graphene.ObjectType):
    """
    A type used to return information when users sign up or authenticate
    """
    auth_token = graphene.String(
        description="JWT used for accessing, controlled content."
    )
    user = graphene.Field(
        lambda: User,
        description="User that has just been created or signed in"
    )
