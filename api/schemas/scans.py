import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import Scans as ScanModel


class Scans(SQLAlchemyObjectType):
	class Meta:
		model = ScanModel
		interfaces = (relay.Node, )


class ScansConnection(relay.Connection):
	class Meta:
		node = Scans