import graphene

from enums.roles import RoleEnums
from scalars.slug import Slug
from schemas.test_user_claims.resolver import resolve_test_user_claims

test_user_claims = graphene.String(
    org_slug=graphene.Argument(Slug, required=True),
    role=graphene.Argument(RoleEnums, required=True),
    resolver=resolve_test_user_claims,
    description="An api endpoint to view a current user's claims -- Requires an active JWT.",
)
