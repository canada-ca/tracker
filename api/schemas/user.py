import graphene
from flask_graphql_auth import create_refresh_token
from graphene import relay, Mutation
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from flask_bcrypt import Bcrypt

from flask import current_app as app

from ..models import Users as UserModel

from ..db import db_session

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


class User(SQLAlchemyObjectType):
	class Meta:
		model = UserModel
		interfaces = (relay.Node,)


class UserConnection(relay.Connection):
	class Meta:
		node = User


class CreateUser(graphene.Mutation):
	class Arguments:
		username = graphene.String(required=True)
		password = graphene.String(required=True)
		email = graphene.String(required=True)

	user = graphene.Field(User)

	@staticmethod
	def mutate(self, info, username, password, email):
		# This will be used for hashing and checking passwords.  Move to __init__.py ?????
		bcrypt = Bcrypt(app)

		user = UserModel(
			username=username,
			user_email=email,
			preferred_lang='English',
			display_name='Default Display Name',
			user_password=bcrypt.generate_password_hash(password=password).decode('UTF-8')  # Hash the password
		)

		db_session.add(user)
		db_session.commit()
