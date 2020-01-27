import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import Dkim_scans as DkimModel


class Dkim(SQLAlchemyObjectType):
	class Meta:
		model = DkimModel
		interfaces = (relay.Node, )


class DkimConnection(relay.Connection):
	class Meta:
		node = Dkim