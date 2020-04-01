import graphene


class DkimReport(graphene.ObjectType):
    """
    DKIM report results
    """
    domain = graphene.String(
        description='DKIM domain'
    )
    selector = graphene.String(
        description='Selector used for DKIM authentication'
    )
    result = graphene.String(
        description='DKIM raw result'
    )
