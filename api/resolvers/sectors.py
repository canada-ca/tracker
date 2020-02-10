from graphql import GraphQLError
from schemas.sectors import Sectors, SectorsModel
from model_enums.sectors import SectorEnum


# Resolvers
def resolve_get_sector_by_id(self, info, **kwargs):
	"""Return a sector by its row ID"""
	sector_id = kwargs.get('id', 1)
	query = Sectors.get_query(info).filter(
		SectorsModel.id == sector_id
	)
	if not len(query.all()):
		raise GraphQLError("Error, Invalid ID")
	return query.all()


def resolve_get_sectors_by_sector(self, info, **kwargs):
	"""Return a list of sectors by its sector"""
	sector = kwargs.get('sector', 'EMPTY')
	sector_enums = set(item.value for item in SectorEnum)

	if sector not in sector_enums:
		raise GraphQLError("Error, Please use a valid enum")

	query = Sectors.get_query(info).filter(
		SectorsModel.sector == sector
	)

	if not len(query.all()):
		raise GraphQLError("Error, Sector does not exist")
	return query.all()


def resolve_get_sector_by_zone(self, info, **kwargs):
	"""Return a list of sectors by their zone"""
	zone = kwargs.get('zone')
	query = Sectors.get_query(info).filter(
		SectorsModel.zone == zone
	)
	if not len(query.all()):
		raise GraphQLError("Error, Zone does not exist")
	return query.all()
