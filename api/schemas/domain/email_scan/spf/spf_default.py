import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFDefault(SQLAlchemyObjectType):
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    record = graphene.String()

    with app.app_context():
        def resolve_record(self: Spf_scans, info):

            if self.spf_scan["spf"]["parsed"]["all"] == "fail":
                if self.spf_scan["spf"]["record"][-4:] == "-all":
                    return "hardfail"
                elif self.spf_scan["spf"]["record"][-4:] == "~all":
                    return "softfail"
            else:
                return self.spf_scan["spf"]["parsed"]["all"]
