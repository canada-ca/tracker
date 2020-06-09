import graphene
import re

from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Spf_scans, Dmarc_scans, Dkim_scans


class SPFTags(SQLAlchemyObjectType):
    """
    Current settings of the currently configured SPF
    """

    class Meta:
        model = Spf_scans
        exclude_fields = ("id", "spf_scan")

    value = graphene.List(
        lambda: graphene.String, description="Important tags retrieved during scan"
    )

    def resolve_value(self: Spf_scans, info):
        tags = []

        if self.spf_scan.get("spf", {}).get("missing", None) is not None:
            tags.append({"spf2": "SPF-missing"})
            return tags

        # Check for bad path
        dkim_orm: Dkim_scans = db_session.query(Dkim_scans).filter(
            Dkim_scans.id == self.id
        ).first()
        dmarc_orm: Dmarc_scans = db_session.query(Dmarc_scans).filter(
            Dmarc_scans.id == self.id
        ).first()

        if dkim_orm is not None:
            dkim_record = dkim_orm.dkim_scan.get("dkim", {}).get("txt_record", None)
            for key in dkim_record:
                if key == "a" or key == "include":
                    tags.append({"spf3": "SPF-bad-path"})

        if dmarc_orm is not None:
            dmarc_record = dmarc_orm.dmarc_scan.get("dmarc", {}).get("record", None)
            if (
                ("include:" in dmarc_record)
                or ("a:" in dmarc_record)
                or ("all" in dmarc_record)
            ):
                if not {"spf3": "SPF-bad-path"} in tags:
                    tags.append({"spf3": "SPF-bad-path"})

        # Check all tag
        all_tag = self.spf_scan.get("spf", {}).get("parsed", {}).get("all", None)
        record_all_tag = self.spf_scan.get("spf", {}).get("record", "")[-4:].lower()

        if isinstance(all_tag, str):
            all_tag = all_tag.lower()

        if record_all_tag != "-all" and record_all_tag != "~all":
            tags.append({"spf10": "ALL-invalid"})
        elif all_tag == "missing":
            tags.append({"spf4": "ALL-missing"})
        elif all_tag == "allow":
            tags.append({"spf5": "ALL-allow"})
        elif all_tag == "neutral":
            tags.append({"spf6": "ALL-neutral"})
        elif all_tag == "redirect":
            tags.append({"spf9": "ALL-redirect"})
        elif all_tag == "fail":
            if record_all_tag == "-all":
                tags.append({"spf8": "ALL-hardfail"})
            elif record_all_tag == "~all":
                tags.append({"spf7": "ALL-softfail"})

        # Check for no host
        record = self.spf_scan.get("spf", {}).get("record", None)
        if record is not None:
            search_string = "a:"
            matches = re.finditer(search_string, record)
            match_pos = [match.start() for match in matches]

            for pos in match_pos:
                if record[pos + 1 : 1] == "" and not {"spf11": "A-all"} in tags:
                    tags.append({"spf11": "A-all"})

        # Look up limit check
        dns_lookups = self.spf_scan.get("spf", {}).get("dns_lookups", 0)
        if dns_lookups > 10:
            tags.append({"spf12": "INCLUDE-limit"})

        # Check for missing include
        include = self.spf_scan.get("spf", {}).get("parsed", {}).get("include", None)
        record = self.spf_scan.get("spf", {}).get("record", None)

        if include is not None and record is not None:
            for item in include:
                check_item = item.get("domain", None)
                if check_item is not None and f"include:{check_item}" not in record:
                    if not {"spf13": "INCLUDE-missing"} in tags:
                        tags.append({"spf13": "INCLUDE-missing"})

        return tags
