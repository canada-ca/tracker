import os
from schemas.user import *
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene import String
import pyotp


class Query(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL queries."""
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)

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

