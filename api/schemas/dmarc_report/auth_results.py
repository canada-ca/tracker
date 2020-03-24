import graphene

from schemas.dmarc_report.dkim_report import DkimReport
from schemas.dmarc_report.spf_report import SpfReport


class AuthResults(graphene.ObjectType):
    """

    """
    dkim = graphene.List(lambda: DkimReport)
    spf = graphene.List(lambda: SpfReport)

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
            print(spf_record)
            rtr_list.append(SpfReport(
                spf_record['domain'],
                spf_record['scope'],
                spf_record['result']
            ))
        return rtr_list
