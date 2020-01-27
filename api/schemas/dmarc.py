import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import Dmarc_scans as DmarcModel


class Dmarc(SQLAlchemyObjectType):
	class Meta:
		model = DmarcModel
		interfaces = (relay.Node, )


class DmarcConnection(relay.Connection):
	class Meta:
		node = Dmarc