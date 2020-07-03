import graphene


class CategoryTotals(graphene.ObjectType):
    """
    This object displays the total amount of messages that fit into each category
    """

    full_pass = graphene.Int(
        description="Amount of messages that have are passing SPF and DKIM."
    )
    partial_pass = graphene.Int(
        description="Amount of messages that are passing either SPF or DKIM, but failing one."
    )
    fail = graphene.Int(description="Amount of messages that fail both SPF and DKIM.")
    total = graphene.Int(description="Sum of all categories.")

    def resolve_full_pass(self: dict, info, **kwargs):
        return self.get("fullPass")

    def resolve_partial_pass(self: dict, info, **kwargs):
        return self.get("partialPass")

    def resolve_fail(self: dict, info, **kwargs):
        return self.get("fail")

    def resolve_total(self: dict, info, **kwargs):
        total = sum((self.get("fullPass"), self.get("partialPass"), self.get("fail"),))
        return total
