from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app.application import app

from schemas.groups import (
    Groups,
    GroupsModel
)

from schemas.sectors import (
    Sectors,
    SectorsModel
)


# Resolvers
def resolve_get_group_by_id(self, info, **kwargs):
    """Return a group by its row ID"""
    group_id = kwargs.get('id', 1)
    with app.app_context():
        query = Groups.get_query(info).filter(
            GroupsModel.id == group_id
        )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid ID")
    return query.all()


def resolve_get_group_by_group(self, info, **kwargs):
    """Return a list of groups by its group"""
    group = kwargs.get('group')
    with app.app_context():
        query = Groups.get_query(info).filter(
            GroupsModel.s_group == group
        )
    if not len(query.all()):
        raise GraphQLError("Error, group does not exist ")
    return query.all()


def resolve_get_group_by_sector(self, info, **kwargs):
    """Return a list of groups by by their associated sector"""
    sector = kwargs.get('sector')
    with app.app_context():
        sector_id = Sectors.get_query(info).filter(
            SectorsModel.sector == sector
        ).options(load_only('id'))

    if not len(sector_id.all()):
        raise GraphQLError("Error, no sector associated with that enum")
    with app.app_context():
        query = Groups.get_query(info).filter(
            GroupsModel.sector_id == sector_id
        )

    if not len(query.all()):
        raise GraphQLError("Error, no groups associated with that sector")
    return query.all()
