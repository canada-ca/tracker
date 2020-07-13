import graphene

from schemas.shared_structures.categorized_summary import CategorizedSummary
from schemas.email_summary.resolver import (
    resolve_email_summary,
    resolve_demo_email_summary,
)

email_summary = graphene.Field(
    lambda: CategorizedSummary,
    resolver=resolve_email_summary,
    description="Email summary computed values, used to build summary cards.",
)

demo_email_summary = graphene.Field(
    lambda: CategorizedSummary,
    resolver=resolve_demo_email_summary,
    description="Demo email summary computed values, used to build summary cards.",
)
