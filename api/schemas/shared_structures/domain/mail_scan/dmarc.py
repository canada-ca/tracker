import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Dmarc_scans, Domains
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class DMARC(SQLAlchemyObjectType):
    """
    Domain-based Message Authentication, Reporting, and Conformance
    (DMARC) is a scalable mechanism by which a mail-originating
    organization can express domain-level policies and preferences for
    message validation, disposition, and reporting, that a mail-receiving
    organization can use to improve mail handling.
    """

    class Meta:
        model = Dmarc_scans
        exclude_fields = ("id", "dmarc_scan")

    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    record = graphene.String(
        description="DMARC record retrieved during the scan of the " "given domain "
    )
    p_policy = graphene.String(
        description="The requested policy you wish mailbox providers to apply "
        "when your email fails DMARC authentication and alignment"
        " checks. "
    )
    sp_policy = graphene.String(
        description="This tag is used to indicate a requested policy for all "
        "subdomains where mail is failing the DMARC "
        "authentication and alignment checks. "
    )
    pct = graphene.Int(
        description="The percentage of messages to which the DMARC policy is "
        "to be applied. "
    )
    dmarc_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan"
    )

    def resolve_domain(self: Dmarc_scans, info, **kwargs):
        return get_domain(self, info)

    def resolve_timestamp(self: Dmarc_scans, info, **kwargs):
        return get_timestamp(self, info)

    def resolve_dmarc_phase(self: Dmarc_scans, info, **kwargs):
        dmarc_phase = self.dmarc_phase
        return dmarc_phase

    def resolve_record(self: Dmarc_scans, info, **kwargs):
        record = self.dmarc_scan.get("dmarc", {}).get("record", None)
        return record

    def resolve_p_policy(self: Dmarc_scans, info, **kwargs):
        p_policy = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("p", {})
            .get("value", None)
        )
        return p_policy

    def resolve_sp_policy(self: Dmarc_scans, info, **kwargs):
        sp_policy = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("sp", {})
            .get("value", None)
        )
        return sp_policy

    def resolve_pct(self: Dmarc_scans, info, **kwargs):
        pct = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("pct", {})
            .get("value", None)
        )
        return pct

    def resolve_dmarc_guidance_tags(self: Dmarc_scans, info, **kwargs):
        tags = []

        if self.dmarc_scan.get("dmarc", {}).get("missing", None) is not None:
            tags.append("dmarc2")
            return tags

        # Check P Policy Tag
        p_policy_tag = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("p", {})
            .get("value", None)
        )

        if p_policy_tag is not None:
            if isinstance(p_policy_tag, str):
                p_policy_tag = p_policy_tag.lower()

            if p_policy_tag == "missing":
                tags.append("dmarc3")
            elif p_policy_tag == "none":
                tags.append("dmarc4")
            elif p_policy_tag == "quarantine":
                tags.append("dmarc5")
            elif p_policy_tag == "reject":
                tags.append("dmarc6")

        # Check PCT Tag
        pct_tag = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("pct", {})
            .get("value", None)
        )

        if pct_tag is not None:
            if isinstance(pct_tag, str):
                pct_tag = pct_tag.lower()
                if pct_tag == "invalid":
                    tags.append("dmarc9")
                elif pct_tag == "none":
                    tags.append("dmarc20")
            elif isinstance(pct_tag, int):
                if pct_tag == 100:
                    tags.append("dmarc7")
                elif 100 > pct_tag > 0:
                    tags.append("dmarc8")
                else:
                    tags.append("dmarc21")

        # Check RUA Tag
        rua_tag = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("rua", {})
            .get("value", None)
        )

        if rua_tag is None or not rua_tag:
            tags.append("dmarc12")
        else:
            if isinstance(rua_tag, str):
                rua_tag = rua_tag.lower()
            for value in rua_tag:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.append("dmarc10")
                else:
                    tags.append("dmarc12")

        # Check RUF Tag
        ruf_tag = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("ruf", {})
            .get("value", None)
        )

        if ruf_tag is None or not ruf_tag:
            tags.append("dmarc13")
        else:
            if isinstance(ruf_tag, str):
                ruf_tag = ruf_tag.lower()
            for value in ruf_tag:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.append("dmarc11")
                else:
                    tags.append("dmarc13")

        # TXT DMARC
        record_tag = self.dmarc_scan.get("dmarc", {}).get("record", None)
        if record_tag == "" or record_tag is None:
            tags.append("dmarc15")
        else:
            tags.append("dmarc14")

        # Check SP tag
        sp_tag = (
            self.dmarc_scan.get("dmarc", {})
            .get("tags", {})
            .get("sp", {})
            .get("value", None)
        )

        if sp_tag is not None:
            if isinstance(sp_tag, str):
                sp_tag = sp_tag.lower()

            if sp_tag == "missing":
                tags.append("dmarc16")
            elif sp_tag == "none":
                tags.append("dmarc17")
            elif sp_tag == "quarantine":
                tags.append("dmarc18")
            elif sp_tag == "reject":
                tags.append("dmarc19")

        return tags
