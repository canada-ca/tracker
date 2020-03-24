import graphene


class PolicyEvaluated(graphene.ObjectType):
    """

    """
    disposition = graphene.String()
    dkim = graphene.String()
    spf = graphene.String()
    policy_override_reasons = graphene.List(lambda: graphene.String)
