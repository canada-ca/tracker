import os
from graphene_sqlalchemy import SQLAlchemyConnectionField
import graphene
from sqlalchemy.orm import joinedload
from graphene import relay, String
import pyotp

from model_enums.sectors import SectorEnums, ZoneEnums
from model_enums.groups import GroupEnums
from model_enums.organiztions import OrganizationsEnum

from schemas.user import *

from schemas.sectors import Sectors
from schemas.groups import Groups
from schemas.organizations import Organizations


from resolvers.sectors import (
	resolve_get_sector_by_id,
	resolve_get_sectors_by_sector,
	resolve_get_sector_by_zone
)

from resolvers.groups import (
	resolve_get_group_by_id,
	resolve_get_group_by_group,
	resolve_get_group_by_sector
)

from resolvers.organizations import (
	resolve_get_org_by_id,
	resolve_get_org_by_org,
	resolve_get_orgs_by_group
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
		description="Allows selection of a sector from a given sector ID"
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
		id=graphene.Argument(graphene.Int, required=True),
		resolver=resolve_get_group_by_id,
		description="Allows selection of a group from a given group ID"
	)
	get_group_by_group = graphene.List(
		of_type=Groups,
		group=graphene.Argument(GroupEnums, required=True),
		resolver=resolve_get_group_by_group,
		description="Allows the selection of group information from a given group enum"
	)
	get_group_by_sector = graphene.List(
		of_type=Groups,
		sector=graphene.Argument(SectorEnums, required=True),
		resolver=resolve_get_group_by_sector,
		description="Allows selection of groups from a given sector enum"
	)
	get_org_by_id = graphene.List(
		of_type=Organizations,
		id=graphene.Argument(graphene.Int, required=True),
		resolver=resolve_get_org_by_id,
		description="Allows the selection of an organization from a given ID"
	)
	get_org_by_org = graphene.List(
		of_type=Organizations,
		org=graphene.Argument(OrganizationsEnum, required=True),
		resolver=resolve_get_org_by_org,
		description="Allows the selection of an organization from its given organization code"
	)
	get_org_by_group = graphene.List(
		of_type=Organizations,
		group=graphene.Argument(GroupEnums, required=True),
		resolver=resolve_get_orgs_by_group,
		description="Allows the selection of organizations from a given group"
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

