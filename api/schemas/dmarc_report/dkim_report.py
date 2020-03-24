import graphene


class DkimReport(graphene.ObjectType):
    """

    """
    domain = graphene.String()
    selector = graphene.String()
    result = graphene.String()
