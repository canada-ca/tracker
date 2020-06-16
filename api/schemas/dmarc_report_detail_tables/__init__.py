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

dmarc_report_detail_tables = graphene.Field(
    lambda: DmarcReportDetailTables,
    domain_slug=graphene.Argument(
        Slug,
        description="The slugified version of the domain you wish to retrieve data for.",
        required=True,
    ),
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
    resolver=resolve_dmarc_report_detail_tables,
    description="Query used for gathering data for dmarc report detail tables.",
)


demo_dmarc_report_detail_tables = graphene.Field(
    lambda: DmarcReportDetailTables,
    domain_slug=graphene.Argument(
        Slug,
        description="The slugified version of the domain you wish to retrieve data for.",
        required=True,
    ),
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
    resolver=resolve_demo_dmarc_report_detail_tables,
    description="Query used for gathering data for dmarc report detail tables.",
)
