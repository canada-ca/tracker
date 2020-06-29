import graphene

from enums.period import PeriodEnums
from scalars.slug import Slug
from scalars.year import Year
from schemas.dmarc_report_detail_tables.dmarc_report_detail_tables import (
    DmarcReportDetailTables,
)
from schemas.dmarc_report_detail_tables.resolver import (
    resolve_dmarc_report_detail_tables,
    resolve_demo_dmarc_report_detail_tables,
)


class DmarcReportDetailTablesInput(graphene.InputObjectType):
    """
    Input object containing fields which map to the required arguments for
    dmarcReportDetailTablesInput
    """

    domain_slug = Slug(
        description="The slugified version of the domain you wish to retrieve data for.",
        required=True,
    )
    period = PeriodEnums(
        description="The period in which the returned data is relevant to.",
        required=True,
    )
    year = Year(
        description="The year in which the returned data is relevant to.",
        required=True,
    )


dmarc_report_detail_tables = graphene.Field(
    lambda: DmarcReportDetailTables,
    input=DmarcReportDetailTablesInput(
        required=True,
        description="Input object containing fields which map to the required "
        "arguments for dmarcReportDetailTablesInput",
    ),
    resolver=resolve_dmarc_report_detail_tables,
    description="Query used for gathering data for dmarc report detail tables.",
)


demo_dmarc_report_detail_tables = graphene.Field(
    lambda: DmarcReportDetailTables,
    input=DmarcReportDetailTablesInput(
        required=True,
        description="Input object containing fields which map to the required "
        "arguments for dmarcReportDetailTablesInput",
    ),
    resolver=resolve_demo_dmarc_report_detail_tables,
    description="Query used for gathering data for dmarc report detail tables.",
)
