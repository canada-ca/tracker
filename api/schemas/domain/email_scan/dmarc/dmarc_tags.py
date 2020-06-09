import graphene
import json
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Dmarc_scans


class DmarcTags(SQLAlchemyObjectType):
    """
    Guidance tags for dmarc scan results
    """
    class Meta:
        model = Dmarc_scans
        exclude_fields = ("id", "dmarc_scan")

    value = graphene.List(
        lambda: graphene.String,
        description="Important tags retrieved during scan"
    )

    def resolve_value(self: Dmarc_scans, info):
        tags = []

        if self.dmarc_scan.get("dmarc", {}).get("missing", None) is not None:
            tags.append({"dmarc2": "DMARC-missing"})
            return tags

        # Check P Policy Tag
        p_policy_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("tags", {}) \
            .get("p", {}) \
            .get("value", None)

        if isinstance(p_policy_tag, str):
            p_policy_tag = p_policy_tag.lower()

        if p_policy_tag == "missing":
            tags.append({"dmarc3": "P-missing"})
        elif p_policy_tag == "none":
            tags.append({"dmarc4": "P-none"})
        elif p_policy_tag == "quarantine":
            tags.append({"dmarc5": "P-quarantine"})
        elif p_policy_tag == "reject":
            tags.append({"dmarc6": "P-reject"})

        # Check PCT Tag
        pct_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("tags", {}) \
            .get("pct", {}) \
            .get("value", None)

        if isinstance(pct_tag, str):
            pct_tag = pct_tag.lower()
            if pct_tag == "invalid":
                tags.append({"dmarc9": "PCT-invalid"})
            elif pct_tag == "none":
                tags.append({"dmarc20": "PCT-none-exists"})
        elif isinstance(pct_tag, int):
            if pct_tag == 100:
                tags.append({"dmarc7": "PCT-100"})
            elif 100 > pct_tag > 0:
                pct_string = "PCT-" + str(
                    pct_tag
                )
                tags.append({"dmarc8": pct_string})
            else:
                tags.append({"dmarc21": "PCT-0"})

        # Check RUA Tag
        rua_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("tags", {}) \
            .get("rua", {}) \
            .get("value", None)

        if isinstance(rua_tag, str):
            rua_tag = rua_tag.lower()

        if rua_tag is None or not rua_tag:
            tags.append({"dmarc12": "RUA-none"})
        else:
            for value in rua_tag:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.append({"dmarc10": "RUA-CCCS"})
                else:
                    tags.append({"dmarc12": "RUA-none"})

        # Check RUF Tag
        ruf_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("tags", {}) \
            .get("ruf", {}) \
            .get("value", None)

        if ruf_tag is None or not ruf_tag:
            tags.append({"dmarc13": "RUF-none"})
        else:
            for value in ruf_tag:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.append({"dmarc11": "RUF-CCCS"})
                else:
                    tags.append({"dmarc13": "RUF-none"})

        # TXT DMARC
        record_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("record", None)
        if record_tag == "" or record_tag is None:
            tags.append({"dmarc15": "TXT-DMARC-missing"})
        else:
            tags.append({"dmarc14": "TXT-DMARC-enabled"})

        # Check SP tag
        sp_tag = self.dmarc_scan.get("dmarc", {}) \
            .get("tags", {}) \
            .get("sp", {}) \
            .get("value", None)

        if isinstance(sp_tag, str):
            sp_tag = sp_tag.lower()

        if sp_tag == "missing":
            tags.append({"dmarc16": "SP-missing"})
        elif sp_tag == "none":
            tags.append({"dmarc17": "SP-none"})
        elif sp_tag == "quarantine":
            tags.append({"dmarc18": "SP-quarantine"})
        elif sp_tag == "reject":
            tags.append({"dmarc19": "SP-reject"})

        return tags
