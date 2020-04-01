import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dkim_scans


class DkimTags(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = (
            "id",
            "dkim_scan"
        )
    value = graphene.String(description="Key tags found during scan")

    with app.app_context():
        def resolve_value(self: Dkim_scans, info):
            tags = {}

            if "missing" in self.dkim_scan:
                return tags.update({"dkim2": "missing"})

            if self.dkim_scan["dkim"]["key_size"] >= 2048 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim5": "P-2048"})
            elif self.dkim_scan["dkim"]["key_size"] == 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim4": "P-1024"})
            elif self.dkim_scan["dkim"]["key_size"] < 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim3": "P-sub1024"})
            else:
                tags.update({"dkim6": "P-invalid"})
