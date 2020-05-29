import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from models import Https_scans


class HTTPSTags(SQLAlchemyObjectType):
    class Meta:
        model = Https_scans
        exclude_fields = ("id", "https_scan")

    value = graphene.String()

    def resolve_value(self, info):
        tags = {}
        return tags
