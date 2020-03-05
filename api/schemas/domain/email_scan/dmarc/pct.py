import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class Pct(SQLAlchemyObjectType):
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    value = graphene.Int()

    with app.app_context():
        def resolve_value(self: Dmarc_scans, info):
            return self.dmarc_scan["dmarc"]["tags"]["pct"]["value"]
