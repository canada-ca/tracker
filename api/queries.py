import os
from schemas.user import *
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene import String
from flask_graphql_auth import *
import pyotp


class MessageField(graphene.ObjectType):
	message = graphene.String()


class ProtectedUnion(graphene.Union):
	class Meta:
		types = (MessageField, AuthInfoField)

	@classmethod
	def resolve_type(cls, instance, info):
		return type(instance)


class Query(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL queries."""
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)

	generate_otp_url = String(email=String(required=True))

	@staticmethod
	def resolve_generate_otp_url(self, info, email):
		totp = pyotp.totp.TOTP(os.getenv('BASE32_SECRET'))  # This needs to be a 16 char base32 secret key
		return totp.provisioning_uri(email, issuer_name="Tracker")

	# TODO: Refactor out this test method and make it actually work ;)

	test_user_claims = graphene.Field(
		type=ProtectedUnion, message=graphene.String(), token=graphene.String()
	)

	@query_jwt_required
	def resolve_test_user_claims(self, info, message):
		role = get_jwt_claims()['roles']
		if role == "admin":
			return MessageField(message=str(get_jwt_claims()))
		else:
			return MessageField("Not an admin, please log in")


class Mutation(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL mutations."""
	create_user = CreateUser.Field()
	sign_in = SignInUser.Field()
	update_password = UpdateUserPassword.Field()
	authenticate_two_factor = ValidateTwoFactor.Field()
	update_user_role = UpdateUserRole.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)

