import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Dkim_scans


class DkimTags(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = ("id", "dkim_scan")

    value = graphene.List(
        lambda: graphene.String,
        description="Key tags found during scan",
    )

    def resolve_value(self: Dkim_scans, info):
        tags = []

        if self.dkim_scan.get("missing", None) is not None:
            return tags.update({"dkim2": "missing"})

        # Get Key Size, and Key Type
        key_size = self.dkim_scan.get("dkim", {}) \
            .get("key_size", None)
        key_type = self.dkim_scan.get("dkim", {}) \
            .get("key_type", None)

        if key_size >= 2048 and key_type == "rsa":
            tags.update({"dkim5": "P-2048"})
        elif key_size == 1024 and key_type == "rsa":
            tags.update({"dkim4": "P-1024"})
        elif key_size < 1024 and key_type == "rsa":
            tags.update({"dkim3": "P-sub1024"})
        else:
            tags.update({"dkim6": "P-invalid"})
