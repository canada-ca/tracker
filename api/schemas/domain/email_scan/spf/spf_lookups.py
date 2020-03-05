import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFLookups(SQLAlchemyObjectType):
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    value = graphene.String()

    with app.app_context():
        def resolve_value(self: Spf_scans, info):
            return self.spf_scan["spf"]["dns_lookups"]
