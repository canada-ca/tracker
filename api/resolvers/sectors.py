from schemas.sectors import *
from graphql import GraphQLError


# Resolvers
def resolve_get_sector_by_id(self, info, **kwargs):
	sector_id = kwargs.get('id', 0)
	query = Sectors.get_query(info).filter(
		SectorsModel.id == sector_id
	)
	if not len(query.all()):
		raise GraphQLError("Error, Invalid ID")
	return query.all()


def resolve_get_sectors_by_sector(self, info, **kwargs):
	sector = kwargs.get('sector', 'GC')
	query = Sectors.get_query(info).filter(
		SectorsModel.sector == sector
	)
	if not len(query.all()):
		raise GraphQLError("Error, Sector does not exist")
	return query.all()


def resolve_get_sector_by_zone(self, info, **kwargs):
	zone = kwargs.get('zone')
	query = Sectors.get_query(info).filter(
		SectorsModel.zone == zone
	)
	if not len(query.all()):
		raise GraphQLError("Error, Zone does not exist")
	return query.all()
