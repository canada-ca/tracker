import graphene

from schemas.shared_structures.catagorized_summary import CatagorizedSummary
from schemas.web_summary.resolver import resolve_web_summary, resolve_demo_web_summary

web_summary = graphene.Field(
    lambda: CatagorizedSummary,
    resolver=resolve_web_summary,
    description="Web summary computed values, used to build the landing page doughnuts.",
)

demo_web_summary = graphene.Field(
    lambda: CatagorizedSummary,
    resolver=resolve_demo_web_summary,
    description="Demo web summary computed values, used to build the public landing page doughnuts.",
)
