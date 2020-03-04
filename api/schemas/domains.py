import graphene
import graphene_sqlalchemy
from graphene import ObjectType, relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from graphene_sqlalchemy.types import ORMField
from sqlalchemy import and_
from sqlalchemy.orm import load_only

from models import Domains as DomainModel


class DomainManagement(SQLAlchemyObjectType):
    class Meta:
        model = DomainModel
        interfaces = (relay.Node,)


class DomainManagementConnection(relay.Connection):
    class Meta:
        node = DomainManagement


class Domains(SQLAlchemyObjectType):
    class Meta:
        model = DomainModel
        interfaces = (relay.Node,)
        exclude_fields = (
            "domain", "scan_spf",
            "scan_dmarc", "scan_dmarc_psl",
            "scan_mx", "scan_dkim",
            "scan_https", "scan_ssl",
            "dmarc_phase"
        )
    url = ORMField(model_attr='domain')


class DomainsConnection(relay.Connection):
    class Meta:
        node = Domains
