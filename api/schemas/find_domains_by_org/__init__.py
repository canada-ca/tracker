import graphene

from graphene_sqlalchemy import SQLAlchemyConnectionField

from scalars.slug import Slug
from schemas.find_domains_by_org.resolver import resolve_find_domains_by_org
from schemas.shared_structures.domain import Domain


class FindDomainsByOrgInput(graphene.InputObjectType):
    """
    This object contains all required fields required for
    """

    org_slug = Slug(
        required=True,
        description="Slugified version of the organization's name that you are "
        "requesting domain information on.",
    )


find_domains_by_org = SQLAlchemyConnectionField(
    Domain._meta.connection,
    input=FindDomainsByOrgInput(
        required=True, description="Input object conataining all required input fields."
    ),
    sort=None,
    description="Select information on an organizations domains.",
)
