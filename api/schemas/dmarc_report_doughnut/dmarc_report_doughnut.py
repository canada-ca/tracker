import graphene

from schemas.shared_structures import CategoryTotals


class DmarcReportDoughnut(graphene.ObjectType):
    """
    A query object used to grab the data to create dmarc report doughnuts
    """

    month = graphene.String(description="Which month is the data based on.")
    year = graphene.Int(description="Which year the data is from.")
    category_totals = graphene.Field(
        lambda: CategoryTotals,
        description="Category totals for building dmarc report page doughnuts.",
    )
