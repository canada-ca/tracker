from graphene_sqlalchemy import SQLAlchemyConnectionField
import graphene
from sqlalchemy.orm import joinedload
from graphene import relay

from schemas.user import (
	UserConnection,
	UserObject,
	CreateUser,
	SignInUser,
	UpdateUserPassword
)

from schemas.sectors import (
	Sectors,
	SectorsModel,
	SectorsConnection
)

from resolvers.sectors import (
	resolve_get_sector_by_id,
	resolve_get_sectors_by_sector,
	resolve_get_sector_by_zone
)


class Query(graphene.ObjectType):
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)
	# all_users = graphene.List(UserObject, failedAttempts=graphene.Int(), resolver=resolve_all_users)
	get_sector_by_id = graphene.List(
		of_type=Sectors,
		id=graphene.Argument(graphene.Int, required=False),
		resolver=resolve_get_sector_by_id
	)
	get_sectors_by_sector = graphene.List(
		of_type=Sectors,
		sector=graphene.Argument(graphene.String, required=False),
		resolver=resolve_get_sectors_by_sector
	)
	get_sector_by_zone = graphene.List(
		of_type=Sectors,
		zone=graphene.Argument(graphene.String, required=False),
		resolver=resolve_get_sector_by_zone
	)


class Mutation(graphene.ObjectType):
	create_user = CreateUser.Field()
	sign_in = SignInUser.Field()
	update_password = UpdateUserPassword.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)

