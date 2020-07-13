import graphene


class SummaryCategory(graphene.ObjectType):
    """
    This object contains the information for each type of summary that has been
    pre-computed
    """

    name = graphene.String(
        description="Category of computed summary which the other fields relate to."
    )
    count = graphene.Int(
        description="Total count of domains that fall into this category."
    )
    percentage = graphene.Float(description="Percentage compared to other categories.")

    def resolve_name(self, info, **kwargs):
        return self.name

    def resolve_count(self, info, **kwargs):
        return self.count

    def resolve_percentage(self, info, **kwargs):
        return self.percentage
