import graphene

from schemas.domain.dmarc_report.source import Source
from schemas.domain.dmarc_report.alignment import Alignment
from schemas.domain.dmarc_report.policy_evaluated import PolicyEvaluated
from schemas.domain.dmarc_report.identifiers import Identifiers
from schemas.domain.dmarc_report.auth_results import AuthResults


class Record(graphene.ObjectType):
    """
    DMARC aggregate report record
    """

    count = graphene.Int(
        description=''
    )
    source = graphene.Field(
        lambda: Source,
        description='DMARC source information'
    )
    alignment = graphene.Field(
        lambda: Alignment,
        description='DMARC alignment\'s'
    )
    policy_evaluated = graphene.Field(
        lambda: PolicyEvaluated,
        description='DMARC policy evaluation'
    )
    identifiers = graphene.Field(
        lambda: Identifiers,
        description='Identifiers Object'
    )
    auth_results = graphene.Field(
        lambda: AuthResults,
        description='Raw DKIM, and SPF results'
    )

