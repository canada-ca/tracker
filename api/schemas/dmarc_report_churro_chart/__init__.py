import graphene

from scalars.slug import Slug
from schemas.dmarc_report_churro_chart.dmarc_report_churro_chart import (
    DmarcReportChurroChart,
)
from schemas.dmarc_report_churro_chart.resolver import (
    resolve_get_dmarc_report_churro_chart,
)

get_dmarc_report_churro_chart = graphene.List(
    lambda: DmarcReportChurroChart,
    domain_slug=graphene.Argument(
        Slug,
        description="The sluified version of the domain you wish to retrieve "
        "data for.",
    ),
    description="A query object used to grab the data to create dmarc report "
    "bar graph.",
    resolver=resolve_get_dmarc_report_churro_chart,
)
