import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFRecord(SQLAlchemyObjectType):
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    record = graphene.String()

    with app.app_context():
        def resolve_record(self: Spf_scans, info):
            return self.spf_scan["spf"]["record"]
