import graphene


class SpfReport(graphene.ObjectType):
    """
    SPF report results
    """
    domain = graphene.String()
    scope = graphene.String()
    result = graphene.String()
