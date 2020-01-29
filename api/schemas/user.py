import graphene
import json
from graphene import relay, Mutation
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Users as User

from functions.create_user import create_user
from functions.sign_in_user import sign_in_user


class UserObject(SQLAlchemyObjectType):
	class Meta:
		model = User
		interfaces = (relay.Node,)


class UserConnection(relay.Connection):
	class Meta:
		node = UserObject


class CreateUser(graphene.Mutation):
	class Arguments:
		username = graphene.String(required=True)
		password = graphene.String(required=True)
		confirm_password = graphene.String(required=True)
		email = graphene.String(required=True)

	user = graphene.Field(lambda: UserObject)

	@staticmethod
	def mutate(self, info, username, password, confirm_password, email):
		create_user(username, password, confirm_password, email)


class SignInUser(graphene.Mutation):
	class Arguments:
		email = graphene.String(required=True, description="User's email")
		password = graphene.String(required=True, description="Users's password")

	user = graphene.Field(lambda: UserObject)
	auth_token = graphene.String(description="Token returned to user")

	@classmethod
	def mutate(cls, _, info, email, password):
		user_dict = sign_in_user(email, password)
		return SignInUser(
			auth_token=user_dict['auth_token'],
			user=user_dict['user']
		)
