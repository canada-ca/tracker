import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from .organizationsModel import Organizations as OrganizationsModel


class Organizations(SQLAlchemyObjectType):
	class Meta:
		model = OrganizationsModel
		interfaces = (relay.Node, )


class OrganizationsConnection(relay.Connection):
	class Meta:
		node = Organizations
