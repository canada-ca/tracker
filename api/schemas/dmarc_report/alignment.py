import graphene
from graphql import ResolveInfo

from app import app


class Alignment(graphene.ObjectType):
    """

    """

    spf = graphene.Boolean()
    dkim = graphene.Boolean()
    dmarc = graphene.Boolean()

