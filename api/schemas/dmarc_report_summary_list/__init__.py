import graphene

from scalars.slug import Slug
from schemas.dmarc_report_summary_list.dmarc_report_summary_list import (
    DmarcReportSummaryList,
)
from schemas.dmarc_report_summary_list.resolver import (
    resolve_dmarc_report_summary_list,
    resolve_demo_dmarc_report_summary_list,
)


class DmarcReportSummaryListInput(graphene.InputObjectType):
    """
    This object is used to define the various arguments used in the dmarc report
    summary list query
    """

    domain_slug = graphene.Argument(
        Slug,
        description="The slugified version of the domain you wish to retrieve "
        "data for.",
        required=True,
    )


dmarc_report_summary_list = graphene.List(
    lambda: DmarcReportSummaryList,
    input=DmarcReportSummaryListInput(
        required=True,
        description="Input argument with various input fields required for the"
        " dmarc report summary list query",
    ),
    description="A query object used to grab the data to create dmarc report "
    "bar graph.",
    resolver=resolve_dmarc_report_summary_list,
)

demo_dmarc_report_summary_list = graphene.List(
    lambda: DmarcReportSummaryList,
    input=DmarcReportSummaryListInput(
        required=True,
        description="Input argument with various input fields required for the"
        " dmarc report summary list query",
    ),
    description="A query object used to grab the data to create dmarc report "
    "bar graph.",
    resolver=resolve_demo_dmarc_report_summary_list,
)
