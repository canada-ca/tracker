import graphene

from schemas.yearly_dmarc_report_summary.resolver import resolve_get_yearly_dmarc_report_summary
from schemas.yearly_dmarc_report_summary.yearly_dmarc_report_summary import YearlyDmarcReportSummary

get_yearly_dmarc_report_summaries = graphene.List(
    lambda: YearlyDmarcReportSummary,
    domain=graphene.Argument(
        graphene.String
    ),
    description="",
    resolver=resolve_get_yearly_dmarc_report_summary
)
