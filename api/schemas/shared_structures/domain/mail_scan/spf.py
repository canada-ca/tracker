import graphene
import re

from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Spf_scans, Dkim_scans, Dmarc_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class SPF(SQLAlchemyObjectType):
    """
    Email on the Internet can be forged in a number of ways.  In
    particular, existing protocols place no restriction on what a sending
    host can use as the "MAIL FROM" of a message or the domain given on
    the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
    protocol is where ADministrative Management Domains (ADMDs) can explicitly
    authorize the hosts that are allowed to use their domain names, and a
    receiving host can check such authorization.
    """

    class Meta:
        model = Spf_scans
        exclude_fields = ("id", "spf_scan")

    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    lookups = graphene.Int(description="The current amount of DNS lookups")
    record = graphene.String(
        description="SPF record retrieved during the scan of the " "given domain "
    )
    spf_default = graphene.String(
        description="Instruction of what a recipient should do if there is "
        "not a match to your SPF record. "
    )
    spf_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan"
    )

    def resolve_domain(self: Spf_scans, info, **kwargs):
        return get_domain(self, info)

    def resolve_timestamp(self: Spf_scans, info, **kwargs):
        return get_timestamp(self, info, **kwargs)

    def resolve_lookups(self: Spf_scans, info, **kwargs):
        lookups = self.spf_scan.get("spf", {}).get("dns_lookups", None)
        return lookups

    def resolve_record(self: Spf_scans, info, **kwargs):
        record = self.spf_scan.get("spf", {}).get("record", None)
        return record

    def resolve_spf_default(self: Spf_scans, info, **kwargs):
        all_parsed = self.spf_scan.get("spf", {}).get("parsed", {}).get("all", None)
        record = self.spf_scan.get("spf", {}).get("record", None)

        if record is not None and len(record) > 4:
            record_all_tag = record[-4:]
        if all_parsed == "fail":
            if record_all_tag == "-all":
                return "hardfail"
            elif record_all_tag == "~all":
                return "softfail"
        else:
            return all_parsed

    def resolve_spf_guidance_tags(self: Spf_scans, info, **kwargs):
        tags = []

        if self.spf_scan.get("spf", {}).get("missing", None) is not None:
            tags.append("spf2")
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
            if dkim_record is not None:
                for key in dkim_record:
                    if key == "a" or key == "include":
                        tags.append("spf3")

        if dmarc_orm is not None:
            dmarc_record = dmarc_orm.dmarc_scan.get("dmarc", {}).get("record", None)
            if dmarc_record is not None:
                if (
                    ("include:" in dmarc_record)
                    or ("a:" in dmarc_record)
                    or ("all" in dmarc_record)
                ):
                    if "spf3" not in tags:
                        tags.append("spf3")

        # Check all tag
        all_tag = self.spf_scan.get("spf", {}).get("parsed", {}).get("all", None)
        record_all_tag = self.spf_scan.get("spf", {}).get("record", None)

        if (all_tag is not None) and (record_all_tag is not None):
            if isinstance(all_tag, str) and isinstance(record_all_tag, str):
                all_tag = all_tag.lower()
                record_all_tag = record_all_tag[-4:].lower()

                if record_all_tag != "-all" and record_all_tag != "~all":
                    tags.append("spf10")
                elif all_tag == "missing":
                    tags.append("spf4")
                elif all_tag == "allow":
                    tags.append("spf5")
                elif all_tag == "neutral":
                    tags.append("spf6")
                elif all_tag == "redirect":
                    tags.append("spf9")
                elif all_tag == "fail":
                    if record_all_tag == "-all":
                        tags.append("spf8")
                    elif record_all_tag == "~all":
                        tags.append("spf7")

        # Check for no host
        record = self.spf_scan.get("spf", {}).get("record", None)
        if record is not None:
            search_string = "a:"
            matches = re.finditer(search_string, record)
            match_pos = [match.start() for match in matches]

            for pos in match_pos:
                if record[pos + 1 : 1] == "" and not "spf11" in tags:
                    tags.append("spf11")

        # Look up limit check
        dns_lookups = self.spf_scan.get("spf", {}).get("dns_lookups", 0)
        if dns_lookups > 10:
            tags.append("spf12")

        # Check for missing include
        include = self.spf_scan.get("spf", {}).get("parsed", {}).get("include", None)
        record = self.spf_scan.get("spf", {}).get("record", None)

        if (include is not None) and (record is not None):
            for item in include:
                check_item = item.get("domain", None)
                if check_item is not None and f"include:{check_item}" not in record:
                    if not "spf13" in tags:
                        tags.append("spf13")

        return tags
