import graphene

from scalars.year import Year
from schemas.shared_structures.detail_tables import DetailTables


class DmarcReportDetailTables(graphene.ObjectType):
    """
    GraphQL object for returning data for dmarc report tables
    """

    month = graphene.String(description="The month in which the data is relevant to.")
    year = Year(description="The year in which the relevant to.")
    detail_tables = graphene.Field(
        lambda: DetailTables,
        description="The details used in creating tables for the dmarc report " "page",
    )
