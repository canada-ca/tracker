import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Admins as AdminsModel


class Admins(SQLAlchemyObjectType):
	class Meta:
		model = AdminsModel
		interfaces = (relay.Node, )


class AdminsConnection(relay.Connection):
	class Meta:
		node = Admins
