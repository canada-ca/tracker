import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from .userModel import Users as UserModel
from .userModel import User_affiliations as UserAff


class User(SQLAlchemyObjectType):
	class Meta:
		model = UserModel
		interfaces = (relay.Node, )
		exclude_fields = 'user_password'


class UserAffClass(SQLAlchemyObjectType):
	class Meta:
		model = UserAff
		interfaces = (relay.Node, )


class UserConnection(relay.Connection):
	class Meta:
		node = User


class UserAffConnection(relay.Connection):
	class Meta:
		node = UserAffClass
