import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class DmarcRecord(SQLAlchemyObjectType):
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    record = graphene.String()

    with app.app_context():
        def resolve_record(self: Dmarc_scans, info):
            return self.dmarc_scan["dmarc"]["record"]
