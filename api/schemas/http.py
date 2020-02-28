import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Https_scans as HttpModel


class HTTP(SQLAlchemyObjectType):
    class Meta:
        model = HttpModel
        interfaces = (relay.Node,)


class HttpConnection(relay.Connection):
    class Meta:
        node = HTTP
