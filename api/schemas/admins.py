import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from api.models import Admins as AdminsModel
from api.models import Admin_affiliations as Admin_aff_Model


class Admins(SQLAlchemyObjectType):
	class Meta:
		model = AdminsModel
		interfaces = (relay.Node, )


class AdminAffiliations(SQLAlchemyObjectType):
	class Meta:
		model = Admin_aff_Model
		interfaces = (relay.Node, )


class AdminsConnection(relay.Connection):
	class Meta:
		node = Admins


class AdminAffConnection(relay.Connection):
	class Meta:
		node = AdminAffiliations
