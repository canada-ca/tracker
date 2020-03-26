import graphene

from scalars.url import URL


class PolicyPbulished(graphene.ObjectType):
    """

    """
    domain = URL(
        description=''
    )
    adkim = graphene.String(
        description=''
    )
    aspf = graphene.String(
        description=''
    )
    p = graphene.String(
        description=''
    )
    sp = graphene.String(
        description=''
    )
    pct = graphene.Int(
        description=''
    )
    fo = graphene.Int(
        description=''
    )
