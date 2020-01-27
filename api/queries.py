from .schemas.auth_token import *
from .schemas.user import *


class Query(graphene.ObjectType):
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)


class Mutation(graphene.ObjectType):
	create_user = CreateUser.Field()
	auth = AuthMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)

