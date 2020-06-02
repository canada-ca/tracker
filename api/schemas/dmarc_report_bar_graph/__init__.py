import graphene

from scalars.slug import Slug
from schemas.dmarc_report_bar_graph.dmarc_report_bar_graph import DmarcReportBarGraph
from schemas.dmarc_report_bar_graph.resolver import resolve_get_dmarc_report_bar_graph

get_dmarc_report_bar_graph = graphene.List(
    lambda: DmarcReportBarGraph,
    domain_slug=graphene.Argument(
        Slug,
        description="The sluified version of the domain you wish to retrieve "
                    "data for."
    ),
    description="A query object used to grab the data to create dmarc report "
                "bar graph.",
    resolver=resolve_get_dmarc_report_bar_graph,
)
