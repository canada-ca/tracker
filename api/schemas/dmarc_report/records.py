import graphene

from app import app

from schemas.dmarc_report.source import Source
from schemas.dmarc_report.alignment import Alignment
from schemas.dmarc_report.policy_evaluated import PolicyEvaluated
from schemas.dmarc_report.identifiers import Identifiers
from schemas.dmarc_report.auth_results import AuthResults


class Record(graphene.ObjectType):
    """

    """

    count = graphene.Int()
    source = graphene.Field(lambda: Source)
    alignment = graphene.Field(lambda: Alignment)
    policy_evaluated = graphene.Field(lambda: PolicyEvaluated)
    identifiers = graphene.Field(lambda: Identifiers)
    auth_results = graphene.Field(lambda: AuthResults)

