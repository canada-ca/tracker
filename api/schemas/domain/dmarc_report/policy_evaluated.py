import graphene


class PolicyEvaluated(graphene.ObjectType):
    """
    Policies evaluated
    """

    disposition = graphene.String(
        description="Tells mail receivers what do do with messages that do not pass your rules"
    )
    dkim = graphene.String(description="DKIM pass/fail")
    spf = graphene.String(description="SPF pass/fail")
    policy_override_reasons = graphene.List(
        lambda: graphene.String, description="List of policy override reasons"
    )
