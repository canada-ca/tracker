import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dkim_scans


class DkimKeyLength(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = (
            "id", "dkim_scan"
        )
    value = graphene.String(description="Length of DKIM public key")

    with app.app_context():
        def resolve_value(self: Dkim_scans, info):
            return self.dkim_scan["dkim"]["key_size"]
