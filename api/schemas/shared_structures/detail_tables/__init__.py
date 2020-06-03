import graphene

from schemas.shared_structures.detail_tables.table_structure import TableStructure


class DetailTables(graphene.ObjectType):
    """
    Object that contains the details for each category
    """
    full_pass = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have full pass",
    )
    spf_failure = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have an spf failure",
    )
    spf_misaligned = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have spf misaligned",
    )
    dkim_failure = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have an dkim failure",
    )
    dkim_misaligned = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have dkim misaligned",
    )
    dmarc_failure = graphene.List(
        lambda: TableStructure,
        description="List of top senders that have an dmarc failure",
    )

    def resolve_full_pass(self: dict, info):
        return self.get("fullPass")

    def resolve_spf_failure(self: dict, info):
        return self.get("spfFailure")

    def resolve_spf_misaligned(self: dict, info):
        return self.get("spfMisaligned")

    def resolve_dkim_failure(self: dict, info):
        return self.get("dkimFailure")

    def resolve_dkim_misaligned(self: dict, info):
        return self.get("dkimMisaligned")

    def resolve_dmarc_failure(self: dict, info):
        return self.get("dmarcFailure")
