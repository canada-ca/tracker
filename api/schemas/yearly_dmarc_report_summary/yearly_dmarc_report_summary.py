import graphene

from schemas.yearly_dmarc_report_summary.category_totals import CategoryTotals


class YearlyDmarcReportSummary(graphene.ObjectType):
    """

    """
    month = graphene.String(
        description=""
    )
    category_total = graphene.Field(
        lambda: CategoryTotals,
        description=""
    )


