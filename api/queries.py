import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField

from .types.Admins.adminsSchema import AdminsConnection, AdminAffConnection
from .types.Domains.domainsSchema import DomainsConnection
from .types.Groups.groupsSchema import GroupsConnection
from .types.Organizations.organizationsSchema import OrganizationsConnection
from .types.Sectors.sectorsSchema import SectorsConnection
from .types.Scans.scansSchema import (
	ScansConnection, DmarcConnection, DkimConnection,
	SpfConnection, HttpConnection, SSL
)

from .types.User.userSchema import UserConnection, UserAffConnection

from .models import base

class Query(graphene.ObjectType):
	node = relay.Node.Field()
	all_users = SQLAlchemyConnectionField(UserConnection, sort=None)


schema = graphene.Schema(query=Query)
