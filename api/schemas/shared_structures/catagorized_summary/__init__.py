import graphene

from schemas.shared_structures.catagorized_summary.summary_category import (
    SummaryCategory,
)


class CatagorizedSummary(graphene.ObjectType):
    """
    This object contains the list of different categories for pre-computed
    summary data with the computed total for how many domains in total are
    being compared.
    """

    categories = graphene.List(
        lambda: SummaryCategory,
        description="List of SummaryCategory objects with data for different computed categories.",
    )
    total = graphene.Int(
        description="Total domains that were checked under this summary."
    )

    def resolve_categories(self, info, **kwargs):
        return self.categories

    def resolve_total(self, info, **kwargs):
        return self.total
