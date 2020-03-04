import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
from sqlalchemy import and_

from models import Dmarc_scans as DmarcModel


class Record(graphene.ObjectType):
    record = graphene.String()


class PPolicy(graphene.ObjectType):
    value = graphene.String()


class SpPolicy(graphene.ObjectType):
    value = graphene.String()


class Pct(graphene.ObjectType):
    value = graphene.Int()


class DmarcGuidanceTags(graphene.ObjectType):
    value = graphene.String()


class Dmarc(graphene.ObjectType):
    id = graphene.ID()
    domain = graphene.String()
    timestamp = graphene.DateTime()
    record = graphene.Field(Record)
    p_policy = graphene.Field(PPolicy)
    sp_policy = graphene.Field(SpPolicy)
    pct = graphene.Field(Pct)
    dmarcGuidanceTags = graphene.Field(DmarcGuidanceTags)


class DmarcConnection(relay.Connection):
    class Meta:
        node = Dmarc
