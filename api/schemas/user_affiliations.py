import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from api.models import User_affiliations as UserAff


class UserAffClass(SQLAlchemyObjectType):
	class Meta:
		model = UserAff
		interfaces = (relay.Node, )


class UserAffConnection(relay.Connection):
	class Meta:
		node = UserAffClass