from graphql import GraphQLError
from schemas.sectors import Sectors, SectorsModel
from model_enums.sectors import SectorEnums
from manage import app


# Resolvers
def resolve_get_sector_by_id(self, info, **kwargs):
    """Return a sector by its row ID"""
    sector_id = kwargs.get('id', 1)
    with app.app_context():
        query = Sectors.get_query(info).filter(
            SectorsModel.id == sector_id
        )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid ID")
    return query.all()


def resolve_get_sectors_by_sector(self, info, **kwargs):
    """Return a list of sectors by its sector"""
    sector = kwargs.get('sector', 'EMPTY')
    with app.app_context():
        query = Sectors.get_query(info).filter(
            SectorsModel.sector == sector
        )
    if not len(query.all()):
        raise GraphQLError("Error, Sector does not exist")
    return query.all()


def resolve_get_sector_by_zone(self, info, **kwargs):
    """Return a list of sectors by their zone"""
    zone = kwargs.get('zone')
    with app.app_context():
        query = Sectors.get_query(info).filter(
            SectorsModel.zone == zone
        )
    if not len(query.all()):
        raise GraphQLError("Error, Zone does not exist")
    return query.all()
