import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Admin_affiliations as Admin_aff_Model


class AdminAffiliations(SQLAlchemyObjectType):
	class Meta:
		model = Admin_aff_Model
		interfaces = (relay.Node, )


class AdminAffConnection(relay.Connection):
	class Meta:
		node = AdminAffiliations
