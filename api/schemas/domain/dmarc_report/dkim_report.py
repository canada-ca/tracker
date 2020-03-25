import graphene


class DkimReport(graphene.ObjectType):
    """
    DKIM report results
    """
    domain = graphene.String()
    selector = graphene.String()
    result = graphene.String()
