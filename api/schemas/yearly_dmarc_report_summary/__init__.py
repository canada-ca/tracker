import graphene

from scalars.slug import Slug
from schemas.yearly_dmarc_report_summary.resolver import (
    resolve_get_yearly_dmarc_report_summary,
)
from schemas.yearly_dmarc_report_summary.yearly_dmarc_report_summary import (
    YearlyDmarcReportSummary,
)

get_yearly_dmarc_report_summaries = graphene.List(
    lambda: YearlyDmarcReportSummary,
    domain_slug=graphene.Argument(
        Slug, description="Slug of domain you want to retrieve data on"
    ),
    description="Gather category totals from the dmarc-report-api",
    resolver=resolve_get_yearly_dmarc_report_summary,
)
