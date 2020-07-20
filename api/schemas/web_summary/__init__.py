import graphene

from schemas.shared_structures.categorized_summary import CategorizedSummary
from schemas.web_summary.resolver import resolve_web_summary, resolve_demo_web_summary

web_summary = graphene.Field(
    lambda: CategorizedSummary,
    resolver=resolve_web_summary,
    description="Web summary computed values, used to build summary cards.",
)

demo_web_summary = graphene.Field(
    lambda: CategorizedSummary,
    resolver=resolve_demo_web_summary,
    description="Demo web summary computed values, used to build summary cards.",
)
