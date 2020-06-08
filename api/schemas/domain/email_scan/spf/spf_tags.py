import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Spf_scans


class SPFTags(SQLAlchemyObjectType):
    """
    Current settings of the currently configured SPF
    """

    class Meta:
        model = Spf_scans
        exclude_fields = ("id", "spf_scan")

    value = graphene.List(
        lambda: graphene.String,
        description="Important tags retrieved during scan"
    )

    def resolve_value(self: Spf_scans, info):
        tags = []

        if self.spf_scan.get("missing", None) is not None:
            return tags.append({"spf2": "missing"})

        # Check all tag
        all_tag = self.spf_scan.get("spf", {}) \
            .get("parsed", {}) \
            .get("all", None)

        if isinstance(all_tag, str):
            all_tag = all_tag.lower()

        if all_tag == "missing":
            tags.append({"spf4": "ALL-missing"})
        elif all_tag == "allow":
            tags.append({"spf5": "ALL-allow"})
        elif all_tag == "neutral":
            tags.append({"spf6": "ALL-neutral"})
        elif all_tag == "redirect":
            tags.append({"spf9": "ALL-redirect"})
        elif all_tag == "fail":
            record_all_tag = self.spf_scan.get("spf", {}) \
                                 .get("record", "")[-4:].lower()
            if record_all_tag == "-all":
                tags.append({"spf8": "ALL-hardfail"})
            elif record_all_tag == "~all":
                tags.append({"spf7": "ALL-softfail"})

        # All tag check
        record_all_tag = self.spf_scan.get("spf", {}) \
            .get("record", "")[-4:].lower()
        if record_all_tag == "-all":
            tags.append({"spf10": "A-all"})

        dns_lookups = self.spf_scan.get("spf", {}).get("dns_lookups", 0)
        if dns_lookups > 10:
            tags.append({"spf11": "INCLUDE-limit"})

        return tags
