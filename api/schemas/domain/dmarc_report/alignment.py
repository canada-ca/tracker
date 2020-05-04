import graphene
from graphql import ResolveInfo

from app import app


class Alignment(graphene.ObjectType):
    """
    DMARC operates by checking that the domain in the message's From: field
    (also called "5322.From") is "aligned" with other authenticated domain
    names. If either SPF or DKIM alignment checks pass, then the DMARC alignment
    test passes.
    """

    spf = graphene.Boolean(description="Is SPF aligned")
    dkim = graphene.Boolean(description="Is DKIM aligned")
    dmarc = graphene.Boolean(description="Is DMARC aligned")
