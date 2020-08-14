import graphene


class CategoryTotals(graphene.ObjectType):
    """
    This object displays the total amount of messages that fit into each category
    """

    full_pass = graphene.Int(
        description="Amount of messages that have are passing SPF and DKIM."
    )
    pass_spf_only = graphene.Int(
        description="Amount of messages that are passing SPF, but failing DKIM."
    )
    pass_dkim_only = graphene.Int(
        description="Amount of messages that are passing DKIM, but failing SPF."
    )
    fail = graphene.Int(description="Amount of messages that fail both SPF and DKIM.")
    total = graphene.Int(description="Sum of all categories.")

    def resolve_full_pass(self: dict, info, **kwargs):
        return self.get("fullPass")

    def resolve_pass_spf_only(self: dict, info):
        return self.get("passSpfOnly", None)

    def resolve_pass_dkim_only(self: dict, info):
        return self.get("passDkimOnly", None)

    def resolve_fail(self: dict, info, **kwargs):
        return self.get("fail")

    def resolve_total(self: dict, info, **kwargs):
        total = sum(
            (
                self.get("fullPass"),
                self.get("passSpfOnly"),
                self.get("passDkimOnly"),
                self.get("fail"),
            )
        )
        return total
