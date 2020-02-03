from schemas.groups import (
	Groups,
	GroupsModel
)
from graphql import GraphQLError


# Resolvers
def resolve_get_group_by_id(self, info, **kwargs):
	group_id = kwargs.get('id', 1)
	query = Groups.get_query(info).filter(
		GroupsModel.id == group_id
	)
	if not len(query.all()):
		raise GraphQLError("Error, invalid ID")
	return query.all()


def resolve_get_group_by_group(self, info, **kwargs):
	group = kwargs.get('group')
	query = Groups.get_query(info).filter(
		GroupsModel.s_group == group
	)
	if not len(query.all()):
		raise GraphQLError("Error, group does not exist ")
	return query.all()


def resolve_get_group_by_sector_id(self, info, **kwargs):
	sector_id = kwargs.get('sectorID')
	query = Groups.get_query(info).filter(
		GroupsModel.sector_id == sector_id
	)
	if not len(query.all()):
		raise GraphQLError("Error, no group with that sector ID")
	return query.all()
