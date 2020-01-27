import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from models_not_used.groups import Groups as GroupsModel


class Groups (SQLAlchemyObjectType):
	class Meta:
		model = GroupsModel
		interfaces = (relay.Node, )


class GroupsConnection(relay.Connection):
	class Meta:
		node = Groups
