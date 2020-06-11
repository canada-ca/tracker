import graphene


class IsUserAdmin(graphene.ObjectType):
    """
    Object used to verify that user has at least one role that is admin or
    super admin
    """

    is_admin = graphene.Boolean(description="Boolean value if user is admin or higher.")
