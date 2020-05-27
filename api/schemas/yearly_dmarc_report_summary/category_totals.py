import graphene


class CategoryTotals(graphene.ObjectType):
    """

    """
    dmarc_fail_none = graphene.Int(
        description=""
    )
    spf_fail_dkim_pass = graphene.Int(
        description=""
    )
    spf_pass_dkim_pass = graphene.Int(
        description=""
    )
    spf_pass_dkim_fail = graphene.Int(
        description=""
    )
    dmarc_fail_quarantine = graphene.Int(
        description=""
    )
    dmarc_fail_reject = graphene.Int(
        description=""
    )
    unknown = graphene.Int(
        description=""
    )

    def resolve_dmarc_fail_none(self, info):
        return self.dmarc_fail_none

    def resolve_spf_fail_dkim_pass(self, info):
        return self.spf_fail_dkim_pass

    def resolve_spf_pass_dkim_pass(self, info):
        return self.spf_pass_dkim_pass

    def resolve_spf_pass_dkim_fail(self, info):
        return self.spf_pass_dkim_fail

    def resolve_dmarc_fail_quarantine(self, info):
        return self.dmarc_fail_quarantine

    def resolve_dmarc_fail_reject(self, info):
        return self.dmarc_fail_reject

    def resolve_unknown(self, info):
        return self.unknown
