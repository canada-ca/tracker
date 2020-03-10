from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Organizations as OrgModel


class Organization(SQLAlchemyObjectType):
    class Meta:
        model = OrgModel
        interface = (relay.Node, )


class OrganizationConnection(relay.Connection):
    class Meta:
        node = Organization
