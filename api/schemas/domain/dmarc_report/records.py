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
        description=''
    )
    alignment = graphene.Field(
        lambda: Alignment,
        description=''
    )
    policy_evaluated = graphene.Field(
        lambda: PolicyEvaluated,
        description=''
    )
    identifiers = graphene.Field(
        lambda: Identifiers,
        description=''
    )
    auth_results = graphene.Field(
        lambda: AuthResults,
        description=''
    )

