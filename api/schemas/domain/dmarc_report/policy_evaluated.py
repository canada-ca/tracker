import graphene


class PolicyEvaluated(graphene.ObjectType):
    """
    Policies evaluated
    """
    disposition = graphene.String(
        description=''
    )
    dkim = graphene.String(
        description=''
    )
    spf = graphene.String(
        description=''
    )
    policy_override_reasons = graphene.List(
        lambda: graphene.String,
        description='List of policy override reasons'
    )
