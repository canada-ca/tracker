import graphene

from enums.period import PeriodEnums
from scalars.year import Year
from scalars.slug import Slug
from schemas.dmarc_report_doughnut.dmarc_report_doughnut import DmarcReportDoughnut
from schemas.dmarc_report_doughnut.resolver import (
    resolve_get_dmarc_report_doughnut,
    resolve_demo_get_dmarc_report_doughnut,
)


get_dmarc_report_doughnut = graphene.Field(
    lambda: DmarcReportDoughnut,
    domain_slug=graphene.Argument(Slug, required=True),
    period=graphene.Argument(PeriodEnums, required=True),
    year=graphene.Argument(Year, required=True),
    description="A query object used to grab the data to create dmarc report "
    "doughnuts",
    resolver=resolve_get_dmarc_report_doughnut,
)

demo_get_dmarc_report_doughnut = graphene.Field(
    lambda: DmarcReportDoughnut,
    domain_slug=graphene.Argument(Slug, required=True),
    period=graphene.Argument(PeriodEnums, required=True),
    year=graphene.Argument(Year, required=True),
    description="A query object used to grab the data to create dmarc report "
    "doughnuts",
    resolver=resolve_demo_get_dmarc_report_doughnut,
)
