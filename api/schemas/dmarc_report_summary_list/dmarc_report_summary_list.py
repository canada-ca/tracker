import graphene

from schemas.shared_structures.category_totals import CategoryTotals


class DmarcReportSummaryList(graphene.ObjectType):
    """
    A query object used to grab the data to create dmarc report bar graph
    """

    month = graphene.String(description="The month that the data is related to.")
    year = graphene.Int(description="The year that the data is related to.")
    category_totals = graphene.Field(
        lambda: CategoryTotals,
        description="Category totals for building dmarc report page bar graph.",
    )
