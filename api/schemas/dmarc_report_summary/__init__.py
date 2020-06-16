import graphene

from enums.period import PeriodEnums
from scalars.year import Year
from scalars.slug import Slug
from schemas.dmarc_report_summary.dmarc_report_summary import DmarcReportSummary
from schemas.dmarc_report_summary.resolver import (
    resolve_dmarc_report_summary,
    resolve_demo_dmarc_report_summary,
)


dmarc_report_summary = graphene.Field(
    lambda: DmarcReportSummary,
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
    description="A query object used to grab the data to create dmarc report "
    "doughnuts",
    resolver=resolve_dmarc_report_summary,
)

demo_dmarc_report_summary = graphene.Field(
    lambda: DmarcReportSummary,
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
    description="A query object used to grab the data to create dmarc report "
    "doughnuts",
    resolver=resolve_demo_dmarc_report_summary,
)
