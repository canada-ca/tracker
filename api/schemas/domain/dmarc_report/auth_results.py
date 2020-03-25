import graphene

from schemas.domain.dmarc_report.dkim_report import DkimReport
from schemas.domain.dmarc_report.spf_report import SpfReport


class AuthResults(graphene.ObjectType):
    """
    DKIM and SPF domain results
    """
    dkim = graphene.List(
        lambda: DkimReport,
        description="DKIM domain results"
    )
    spf = graphene.List(
        lambda: SpfReport,
        description='SPF domain results'
    )

    def resolve_dkim(self: dict, info):
        rtr_list = []
        for dkim_record in self['dkim']:
            rtr_list.append(DkimReport(
                dkim_record['domain'],
                dkim_record['selector'],
                dkim_record['result']
            ))
        return rtr_list

    def resolve_spf(self: dict, info):
        rtr_list = []
        for spf_record in self['spf']:
            rtr_list.append(SpfReport(
                spf_record['domain'],
                spf_record['scope'],
                spf_record['result']
            ))
        return rtr_list
