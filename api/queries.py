import os
from schemas.user import *
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene import String
from flask_graphql_auth import *
import pyotp

from resolvers.users import (
	resolve_test_user_claims,
	resolve_generate_otp_url,
)


class Query(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL queries."""
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)

	generate_otp_url = graphene.String(
		email=graphene.Argument(EmailAddress, required=True),
		resolver=resolve_generate_otp_url,
		description="An api endpoint used to generate a OTP url"
	)

	test_user_claims = graphene.String(
		token=graphene.Argument(graphene.String, required=True),
		resolver=resolve_test_user_claims,
		description="An api endpoint to view a current user's claims"
	)


class Mutation(graphene.ObjectType):
	"""The central gathering point for all of the GraphQL mutations."""
	create_user = CreateUser.Field()
	sign_in = SignInUser.Field()
	update_password = UpdateUserPassword.Field()
	authenticate_two_factor = ValidateTwoFactor.Field()
	update_user_role = UpdateUserRole.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)