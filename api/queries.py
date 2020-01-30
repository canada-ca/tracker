from schemas.auth_token import *
from schemas.user import *
from graphene_sqlalchemy import SQLAlchemyConnectionField


class Query(graphene.ObjectType):
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)


class Mutation(graphene.ObjectType):
	create_user = CreateUser.Field()
	sign_in = SignInUser.Field()
	update_password = UpdateUserPassword.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)

