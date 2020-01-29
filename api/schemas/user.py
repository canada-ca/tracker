import graphene
import json
from flask_graphql_auth import create_refresh_token
from graphene import relay, Mutation
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from graphql import GraphQLError
from flask import current_app as app
from flask_bcrypt import Bcrypt

from models import Users as User
from db import db_session
from functions.input_validators import *

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

		username = cleanse_input(username)
		password = cleanse_input(password)
		confirm_password = cleanse_input(confirm_password)
		email = cleanse_input(email)

		if not is_strong_password(password):
			raise GraphQLError("Password does not meet minimum requirements (Min. 8 chars, Uppercase, Number, Special Char)")

		if password != confirm_password:
			raise GraphQLError("Passwords do not match")

		bcrypt = Bcrypt(app)

		user = User(
			username=username,
			user_email=email,
			preferred_lang='English',
			display_name='Default Display Name',
			user_password=bcrypt.generate_password_hash(password=password).decode('UTF-8')  # Hash the password
		)

		db_session.add(user)
		try:
			db_session.commit()
		except Exception as e:
			db_session.rollback()
			db_session.flush()
		raise GraphQLError("Error creating account, please try again")


class SignInUser(graphene.Mutation):
	class Arguments:
		email = graphene.String(required=True, description="User's email")
		password = graphene.String(required=True, description="Users's password")

	user = graphene.Field(lambda: UserObject)
	auth_token = graphene.String(description="Token returned to user")

	@classmethod
	def mutate(cls, _, info, email, password):
		email = cleanse_input(email)
		password = cleanse_input(password)
		user = User.query.filter(User.user_email == email).first()

		if user is None:
			raise GraphQLError("User does not exist, please register")

		bcrypt = Bcrypt(app)

		email_match = email == user.user_email
		password_match = bcrypt.check_password_hash(user.user_password, password)

		if email_match and password_match:
			return SignInUser(
				auth_token=create_access_token(user.id),
				user=user
			)
		else:
			raise GraphQLError("Incorrect email or password")
