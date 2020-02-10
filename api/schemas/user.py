import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from functions.create_user import create_user
from functions.sign_in_user import sign_in_user
from functions.update_user_password import update_password
from functions.validate_two_factor import validate_two_factor

from models import Users as User
from scalars.email_address import *


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
		email = EmailAddress(required=True)

	user = graphene.Field(lambda: UserObject)

	@staticmethod
	def mutate(self, info, username, password, confirm_password, email):
		user = create_user(username, password, confirm_password, email)
		return CreateUser(user=user)
	

class SignInUser(graphene.Mutation):
	class Arguments:
		email = EmailAddress(required=True, description="User's email")
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


class UpdateUserPassword(graphene.Mutation):
	class Arguments:
		password = graphene.String(required=True)
		confirm_password = graphene.String(required=True)
		email = EmailAddress(required=True)

	user = graphene.Field(lambda: UserObject)

	@staticmethod
	def mutate(self, info, password, confirm_password, email):
		user = update_password(email=email, password=password, confirm_password=confirm_password)
		return UpdateUserPassword(user=user)

class ValidateTwoFactor(graphene.Mutation):
	class Arguments:
		email = EmailAddress(required=True)
		otp_code = graphene.String(required=True)

	user = graphene.Field(lambda: UserObject)

	@staticmethod
	def mutate(self, info, email, otp_code):
		user_to_rtn = validate_two_factor(email=email, otp_code=otp_code)
		return ValidateTwoFactor(user=user_to_rtn)
