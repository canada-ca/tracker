import graphene


class SpfReport(graphene.ObjectType):
    """
    SPF report results
    """

    domain = graphene.String(description="SPF domain")
    scope = graphene.String(description="SPF domain scope (“HELP/EHLO” or “MFROM”)")
    result = graphene.String(description="SPF raw result")
