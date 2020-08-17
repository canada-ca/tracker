import graphene

from enums.period import PeriodEnums
from scalars.year import Year
from schemas.dmarc_report_summary_table.dmarc_report_summary_table import (
    DmarcReportSummaryTable,
)
from schemas.dmarc_report_summary_table.resolver import (
    resolve_dmarc_report_summary_table,
    resolve_demo_dmarc_report_summary_table,
)

dmarc_report_summary_table = graphene.Field(
    lambda: DmarcReportSummaryTable,
    period=graphene.Argument(
        PeriodEnums,
        description="The period in which the returned data is relevant to.",
        required=True,
    ),
    year=graphene.Argument(
        Year,
        description="The year in which the returned data is relevant to.",
        required=True,
    ),
    description="Query for creating domain summary table.",
    resolver=resolve_dmarc_report_summary_table,
)

demo_dmarc_report_summary_table = graphene.Field(
    lambda: DmarcReportSummaryTable,
    period=graphene.Argument(
        PeriodEnums,
        description="The period in which the returned data is relevant to.",
        required=False,
    ),
    year=graphene.Argument(
        Year,
        description="The year in which the returned data is relevant to.",
        required=False,
    ),
    description="Query for creating domain summary table.",
    resolver=resolve_demo_dmarc_report_summary_table,
)
