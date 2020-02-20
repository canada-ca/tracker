from graphql import GraphQLError
from sqlalchemy.orm import load_only

from schemas.organizations import (
    Organizations,
    OrganizationsModel
)

from schemas.groups import (
    Groups,
    GroupsModel
)


# Resolvers
def resolve_get_org_by_id(self, info, **kwargs):
    """Return an organization by its id"""
    org_id = kwargs.get('id')
    query = Organizations.get_query(info).filter(
        OrganizationsModel.id == org_id
    )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid ID")
    return query.all()


def resolve_get_org_by_org(self, info, **kwargs):
    """Return an organization by its organization code"""
    org_code = kwargs.get('org')
    query = Organizations.get_query(info).filter(
        OrganizationsModel.organization == org_code
    )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid Organization")
    return query.all()


def resolve_get_orgs_by_group(self, info, **kwargs):
    group = kwargs.get('group')
    group_id = Groups.get_query(info).filter(
        GroupsModel.s_group == group
    ).options(load_only('id'))

    if not len(group_id.all()):
        raise GraphQLError("Error, no group associated with that enum")

    query = Organizations.get_query(info).filter(
        OrganizationsModel.group_id == group_id
    )

    if not len(query.all()):
        raise GraphQLError("Error, no organizations associated with that group")
    return query.all()
