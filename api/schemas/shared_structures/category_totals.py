import graphene


class CategoryTotals(graphene.ObjectType):
    """
    This object displays the total amount of messages that fit into each category
    """

    dmarc_fail_none = graphene.Int(
        description="Amount of messages that failed dmarc and nothing was done."
    )
    spf_fail_dkim_pass = graphene.Int(
        description="Amount of messages that failed SPF, but passed DKIM."
    )
    spf_pass_dkim_pass = graphene.Int(
        description="Amount of messages that passed SPF and DKIM."
    )
    spf_pass_dkim_fail = graphene.Int(
        description="Amount of messages that passed SPF, but failed DKIM."
    )
    dmarc_fail_quarantine = graphene.Int(
        description="Amount of messages that failed DMARC and were quarantined."
    )
    dmarc_fail_reject = graphene.Int(
        description="Amount of messages that failed DMARC and were rejected."
    )
    total = graphene.Int(description="The sum of all different categories.")

    def resolve_dmarc_fail_none(self: dict, info):
        return self.get("dmarcFailNone")

    def resolve_spf_fail_dkim_pass(self: dict, info):
        return self.get("spfFailDkimPass")

    def resolve_spf_pass_dkim_pass(self: dict, info):
        return self.get("spfPassDkimPass")

    def resolve_spf_pass_dkim_fail(self: dict, info):
        return self.get("spfPassDkimFail")

    def resolve_dmarc_fail_quarantine(self: dict, info):
        return self.get("dmarcFailQuarantine")

    def resolve_dmarc_fail_reject(self: dict, info):
        return self.get("dmarcFailReject")

    def resolve_total(self: dict, info):
        total = sum(
            (
                self.get("dmarcFailNone"),
                self.get("spfFailDkimPass"),
                self.get("spfPassDkimPass"),
                self.get("spfPassDkimFail"),
                self.get("dmarcFailQuarantine"),
                self.get("dmarcFailReject"),
            )
        )
        return total
