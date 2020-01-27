import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import Spf_scans as SpfModel


class Spf(SQLAlchemyObjectType):
	class Meta:
		model = SpfModel
		interfaces = (relay.Node, )


class SpfConnection(relay.Connection):
	class Meta:
		node = Spf