import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFTags(SQLAlchemyObjectType):
    """
    Current settings of the currently configured SPF
    """
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id",
            "spf_scan"
        )
    value = graphene.String(description="Important tags retrieved during scan")

    with app.app_context():
        def resolve_value(self: Spf_scans, info):
            tags = {}

            if 'missing' in self.spf_scan["spf"]:
                return tags.update({"spf2": "missing"})

            # Check all tag
            if self.spf_scan["spf"]["parsed"]["all"] == "missing":
                tags.update({"spf4": "ALL-missing"})
            elif self.spf_scan["spf"]["parsed"]["all"] == "allow":
                tags.update({"spf5": "ALL-allow"})
            elif self.spf_scan["spf"]["parsed"]["all"] == "neutral":
                tags.update({"spf6": "ALL-neutral"})
            elif self.spf_scan["spf"]["parsed"]["all"] == "redirect":
                tags.update({"spf9": "ALL-redirect"})
            elif self.spf_scan["spf"]["parsed"]["all"] == "fail":
                if self.spf_scan["spf"]["record"][-4:] == "-all":
                    tags.update({"spf8": "ALL-hardfail"})
                elif self.spf_scan["spf"]["record"][-4:] == "~all":
                    tags.update({"spf7": "ALL-softfail"})

            if self.spf_scan["spf"]["record"][-4:] == "-all":
                tags.update({"spf10": "A-all"})

            if self.spf_scan["spf"]["dns_lookups"] > 10:
                tags.update({"spf11": "INCLUDE-limit"})

            return tags
