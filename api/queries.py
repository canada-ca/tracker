import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField

from .types.User.userSchema import UserConnection


class Query(graphene.ObjectType):
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)


schema = graphene.Schema(query=Query)
