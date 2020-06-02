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
