import graphene

from flask_graphql_auth import (
	AuthInfoField,
	GraphQLAuth,
	get_jwt_identity,
	get_raw_jwt,
	create_access_token,
	create_refresh_token,
	query_jwt_required,
	mutation_jwt_refresh_token_required,
	mutation_jwt_required,
)


class AuthMutation(graphene.Mutation):
	class Arguments:
		username = graphene.String()
		password = graphene.String()

	access_token = graphene.String()

	@classmethod
	def mutate(cls, _, info, username, password):
		return AuthMutation(
			access_token=create_access_token(username),
		)
