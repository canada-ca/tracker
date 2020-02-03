import os
from graphene_sqlalchemy import SQLAlchemyConnectionField
import graphene
from sqlalchemy.orm import joinedload
from graphene import relay, String
import pyotp

from model_enums.sectors import SectorEnums, ZoneEnums

from schemas.user import *

from schemas.sectors import Sectors
from schemas.groups import Groups

from resolvers.sectors import (
	resolve_get_sector_by_id,
	resolve_get_sectors_by_sector,
	resolve_get_sector_by_zone
)

from resolvers.groups import (
	resolve_get_group_by_id,
	resolve_get_group_by_group,
	resolve_get_group_by_sector_id
)


class Query(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL queries."""
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)
	# all_users = graphene.List(UserObject, failedAttempts=graphene.Int(), resolver=resolve_all_users)
	# all_sectors = SQLAlchemyConnectionField(SectorsConnection, sort=None)
	# all_groups = SQLAlchemyConnectionField(GroupsConnection, sort=None)
	get_sector_by_id = graphene.List(
		of_type=Sectors,
		id=graphene.Argument(graphene.Int, required=True),
		resolver=resolve_get_sector_by_id,
		description="Allows selection of all sectors from a given sector ID"
	)
	get_sectors_by_sector = graphene.List(
		of_type=Sectors,
		sector=graphene.Argument(SectorEnums, required=True),
		resolver=resolve_get_sectors_by_sector,
		description="Allows selection of sector information from a given sector enum"
	)
	get_sector_by_zone = graphene.List(
		of_type=Sectors,
		zone=graphene.Argument(ZoneEnums, required=True),
		resolver=resolve_get_sector_by_zone,
		description="Allows selection of all sectors from a given zone enum"
	)
	get_group_by_id = graphene.List(
		of_type=Groups,
		id=graphene.Argument(graphene.Int, required=False),
		resolver=resolve_get_group_by_id
	)
	get_group_by_group = graphene.List(
		of_type=Groups,
		group=graphene.Argument(graphene.String, required=True),
		resolver=resolve_get_group_by_group
	)
	get_group_by_sector_id = graphene.List(
		of_type=Groups,
		sectorID=graphene.Argument(graphene.Int, required=True),
		resolver=resolve_get_group_by_sector_id
	)

	generate_otp_url = String(email=String(required=True))

	@staticmethod
	def resolve_generate_otp_url(self, info, email):
		totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
		return totp.provisioning_uri(email, issuer_name="Tracker")


class Mutation(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL mutations."""
	create_user = CreateUser.Field()
	sign_in = SignInUser.Field()
	update_password = UpdateUserPassword.Field()
	authenticate_two_factor = ValidateTwoFactor.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)

