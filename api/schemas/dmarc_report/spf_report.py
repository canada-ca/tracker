import graphene


class SpfReport(graphene.ObjectType):
    """

    """
    domain = graphene.String()
    scope = graphene.String()
    result = graphene.String()
