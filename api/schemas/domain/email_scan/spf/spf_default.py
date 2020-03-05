import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFDefault(SQLAlchemyObjectType):
    """
    Mechanisms after "all" will never be tested.  Mechanisms listed after
    "all" MUST be ignored.  Any "redirect" modifier  MUST be ignored when
    there is an "all" mechanism in the record, regardless of the relative
    ordering of the terms.
    """
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    record = graphene.String(description="Current all value")

    with app.app_context():
        def resolve_record(self: Spf_scans, info):

            if self.spf_scan["spf"]["parsed"]["all"] == "fail":
                if self.spf_scan["spf"]["record"][-4:] == "-all":
                    return "hardfail"
                elif self.spf_scan["spf"]["record"][-4:] == "~all":
                    return "softfail"
            else:
                return self.spf_scan["spf"]["parsed"]["all"]
