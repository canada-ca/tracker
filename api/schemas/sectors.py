import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from graphene_sqlalchemy.enums import *

from models import Sectors as SectorsModel


class Sectors(SQLAlchemyObjectType):
    class Meta:
        model = SectorsModel
        interfaces = (relay.Node,)


class SectorsConnection(relay.Connection):
    class Meta:
        node = Sectors
