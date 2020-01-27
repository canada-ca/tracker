import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import Users as UserModel


class User(SQLAlchemyObjectType):
	class Meta:
		model = UserModel
		interfaces = (relay.Node, )
		exclude_fields = 'user_password'


class UserConnection(relay.Connection):
	class Meta:
		node = User
