import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from .userModel import Users as UserModel


class User(SQLAlchemyObjectType):
	class Meta:
		model = UserModel
		interfaces = (relay.Node, )


class UserConnection(relay.Connection):
	class Meta:
		node = User
