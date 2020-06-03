import graphene

from enums.period import PeriodEnums
from scalars.slug import Slug
from scalars.year import Year
from schemas.dmarc_report_detailed_tables.dmarc_report_detailed_tables import DmarcReportDetailedTables
from schemas.dmarc_report_detailed_tables.resolver import resolve_dmarc_report_detailed_tables

get_dmarc_report_detailed_tables = graphene.Field(
    lambda: DmarcReportDetailedTables,
    domain_slug=graphene.Argument(Slug, description=""),
    period=graphene.Argument(PeriodEnums, description=""),
    year=graphene.Argument(Year, description=""),
    resolver=resolve_dmarc_report_detailed_tables,
    description=""
)
