import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dkim_scans


class DkimRecord(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = (
            "id", "dkim_scan"
        )
    record = graphene.String(description="Record value retrieved during scan")

    with app.app_context():
        def resolve_record(self: Dkim_scans, info):
            return self.dkim_scan["dkim"]["txt_record"]
