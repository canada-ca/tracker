import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Ssl_scans as SSLModel


class SSL(SQLAlchemyObjectType):
    class Meta:
        model = SSLModel
        interfaces = (relay.Node,)


class SSLConnection(relay.Connection):
    class Meta:
        node = SSL
