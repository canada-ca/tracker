from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import app

from schemas.domains import (
    Domains,
    DomainModel
)

from schemas.organizations import (
    Organizations,
    OrganizationsModel
)


# Resolvers
def resolve_get_domain_by_id(self, info, **kwargs):
    """Return a domain by its row ID"""
    group_id = kwargs.get('id', 1)
    with app.app_context():
        query = Domains.get_query(info).filter(
            DomainModel.id == group_id
        )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid ID")
    return query.all()


def resolve_get_domain_by_domain(self, info, **kwargs):
    """Return a domain  by a url"""
    domain = kwargs.get('url')
    with app.app_context():
        query = Domains.get_query(info).filter(
            DomainModel.domain == domain
        )
    if not len(query.all()):
        raise GraphQLError("Error, domain  does not exist")
    return query.all()


def resolve_get_domain_by_organization(self, info, **kwargs):
    """Return a list of domains by by their associated organization"""
    organization = kwargs.get('org')
    with app.app_context():
        organization_id = Organizations.get_query(info).filter(
            OrganizationsModel.organization == organization
        ).options(load_only('id'))

    if not len(organization_id.all()):
        raise GraphQLError("Error, no organization associated with that enum")
    with app.app_context():
        query = Domains.get_query(info).filter(
            DomainModel.organization_id == organization_id
        )

    if not len(query.all()):
        raise GraphQLError(
            "Error, no domains associated with that organization")
    return query.all()
