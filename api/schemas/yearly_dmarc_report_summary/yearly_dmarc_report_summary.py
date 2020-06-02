import graphene

from schemas.shared_structures import CategoryTotals


class YearlyDmarcReportSummary(graphene.ObjectType):
    """
    Yearly overview of various category totals from the external dmarc report api
    """

    month = graphene.String(description="Which month is the data based on")
    year = graphene.String(description="Which year the data is from")
    category_total = graphene.Field(
        lambda: CategoryTotals, description="Category totals for quick viewing"
    )
