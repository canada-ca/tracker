import graphene
import json
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class DmarcTags(SQLAlchemyObjectType):
    """
    """
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id",
            "dmarc_scan"
        )

    value = graphene.String(description="Important tags retrieved during scan")

    with app.app_context():
        def resolve_value(self: Dmarc_scans, info):
            tags = {}

            if 'missing' in self.dmarc_scan["dmarc"]:
                return tags.update({"dmarc2": "missing"})

            # Check PCT Tag
            if self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] == 100:
                tags.update({"dmarc7": "PCT-100"})
            elif 100 > self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] > 0:
                pct_string = "PCT-" + str(self.dmarc_scan["dmarc"]["tags"]["pct"]["value"])
                tags.update({"dmarc8": pct_string})
            elif self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] == "invalid":
                tags.update({"dmarc9": "PCT-invalid"})
            elif self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] == "none":
                tags.update({"dmarc20": "PCT-none=exists"})
            else:
                tags.update({"dmarc21": "PCT-0"})

            # Check RUA Tag
            for value in self.dmarc_scan["dmarc"]["tags"]["rua"]["value"]:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.update({"dmarc10": "RUA-CCCS"})
                else:
                    tags.update({"dmarc12": "RUA-none"})

            # Check RUF Tag
            for value in self.dmarc_scan["dmarc"]["tags"]["ruf"]["value"]:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.update({"dmarc11": "RUF-CCCS"})
                else:
                    tags.update({"dmarc13": "RUF-none"})

            # Check P Policy Tag
            p_tags = {
                "missing": {"dmarc3": "P-missing"},
                "none": {"dmarc4": "P-none"},
                "quarantine": {"dmarc5": "P-quarantine"},
                "reject": {"dmarc6": "P-reject"}
            }
            p_status = p_tags.get(
                self.dmarc_scan["dmarc"]["tags"]["p"]["value"]
            )
            if p_status is not None:
                tags.update(p_status)

            # Check SP tag
            sp_tags = {
                "missing": {"dmarc16": "SP-missing"},
                "none": {"dmarc17": "SP-none"},
                "quarantine": {"dmarc18": "SP-quarantine"},
                "reject": {"dmarc19": "SP-reject"}
            }
            sp_status = sp_tags.get(
                self.dmarc_scan["dmarc"]["tags"]["sp"]["value"]
            )
            if sp_status is not None:
                tags.update(sp_status)

            return tags
