import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from models_not_used.domains import Domains as DomainModel


class Domains(SQLAlchemyObjectType):
	class Meta:
		model = DomainModel
		interfaces = (relay.Node, )


class DomainsConnection(relay.Connection):
	class Meta:
		node = Domains
