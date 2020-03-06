from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import app
from models import Organizations as OrgModel

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read

from schemas.domain import Domain, Domains
from schemas.organizations import Organization


@require_token
def resolve_domain(self, info, **kwargs):
    """Return a domain  by a url"""
    domain = kwargs.get('url')
    user_role = kwargs.get('user_roles')

    with app.app_context():
        org_id_list = []
        for role in user_role:
            org_id_list.append(role["org_id"])

        if is_super_admin(user_role):
            query = Domains.get_query(info).filter(
                Domains.domain == domain
            )
        elif is_user_read(user_role):
            query = Domains.get_query(info).filter(
                Domains.domain == domain
            ).filter(
                Domains.organization_id.in_(org_id_list)
            )

    if not len(query.all()):
        raise GraphQLError("Error, domain  does not exist")
    return query.all()


@require_token
def resolve_domains(self, info, **kwargs):
    """Return a list of domains by by their associated organization"""
    organization = kwargs.get('org')
    with app.app_context():
        organization_id = Organization.get_query(info).filter(
            OrgModel.organization == organization
        ).options(load_only('id'))

    if not len(organization_id.all()):
        raise GraphQLError("Error, no organization associated with that enum")
    with app.app_context():
        query = Domains.get_query(info).filter(
            Domains.organization_id == organization_id
        )

    if not len(query.all()):
        raise GraphQLError(
            "Error, no domains associated with that organization")
    return query.all()
