import graphene

from scalars.url import URL


class PolicyPbulished(graphene.ObjectType):
    """
    Domains published policy
    """
    domain = URL(
        description='Domain report was generated from'
    )
    adkim = graphene.String(
        description='DKIM alignment mode'
    )
    aspf = graphene.String(
        description='SPF alignment mode'
    )
    p = graphene.String(
        description='P Policy'
    )
    sp = graphene.String(
        description='SP Policy'
    )
    pct = graphene.Int(
        description='DMARC Percentage'
    )
    fo = graphene.Int(
        description='Lets mailbox providers knows if you want sample messages '
                    'that failed either SPF or DKIM'
    )
