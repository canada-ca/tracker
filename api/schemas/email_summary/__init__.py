import graphene

from schemas.shared_structures.catagorized_summary import CatagorizedSummary
from schemas.email_summary.resolver import (
    resolve_email_summary,
    resolve_demo_email_summary,
)

email_summary = graphene.Field(
    lambda: CatagorizedSummary,
    resolver=resolve_email_summary,
    description="Email summary computed values, used to build summary cards.",
)

demo_email_summary = graphene.Field(
    lambda: CatagorizedSummary,
    resolver=resolve_demo_email_summary,
    description="Demo email summary computed values, used to build summary cards.",
)
