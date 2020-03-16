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
            if "pct" in self.dmarc_scan["dmarc"]["tags"]:
                if self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] == 100:
                    tags.update({"dmarc7": "PCT-100"})
                elif 100 > self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] > 0:
                    pct_string = "PCT-" + str(
                        self.dmarc_scan["dmarc"]["tags"]["pct"]["value"])
                    tags.update({"dmarc8": pct_string})
                elif self.dmarc_scan["dmarc"]["tags"]["pct"]["value"] == 0:
                    tags.update({"dmarc21": "PCT-0"})
                else:
                    tags.update({"dmarc9": "PCT-invalid"})

            # Check RUA Tag
            for value in self.dmarc_scan["dmarc"]["tags"]["rua"]["value"]:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.update({"dmarc10": "RUA-CCCS"})
                elif value["address"] is not None:
                    tags.update({"dmarc22": "CNAME-DMARC"})
            if not self.dmarc_scan["dmarc"]["tags"]["rua"]["value"]:
                tags.update({"dmarc12": "RUA-none"})

            # Check RUF Tag
            for value in self.dmarc_scan["dmarc"]["tags"]["ruf"]["value"]:
                if value["address"] == "dmarc@cyber.gc.ca":
                    tags.update({"dmarc11": "RUF-CCCS"})
                elif value["address"] is not None and "dmarc22" not in tags:
                    tags.update({"dmarc22": "CNAME-DMARC"})
            if not self.dmarc_scan["dmarc"]["tags"]["ruf"]["value"]:
                tags.update({"dmarc13": "RUF-none"})

            # Check PCT-none-exists tag
            if "p" in self.dmarc_scan["dmarc"]["tags"]:
                # Check P Policy Tag
                p_tags = {
                    "none": {"dmarc4": "P-none"},
                    "quarantine": {"dmarc5": "P-quarantine"},
                    "reject": {"dmarc6": "P-reject"}
                }
                p_status = p_tags.get(
                    self.dmarc_scan["dmarc"]["tags"]["p"]["value"]
                )
                if p_status is not None:
                    tags.update(p_status)

                if self.dmarc_scan["dmarc"]["tags"]["p"]["value"] == "none" \
                    and ("pct" not in self.dmarc_scan["dmarc"]["tags"]
                         or self.dmarc_scan["dmarc"]["tags"]["pct"] != 100):
                    tags.update({"dmarc20": "PCT-none-exists"})

            elif "p" not in self.dmarc_scan["dmarc"]["tags"]:
                tags.update({"dmarc3": "P-missing"})

            if "sp" in self.dmarc_scan["dmarc"]["tags"]["sp"]["value"]:
                # Check SP tag
                sp_tags = {
                    "none": {"dmarc17": "SP-none"},
                    "quarantine": {"dmarc18": "SP-quarantine"},
                    "reject": {"dmarc19": "SP-reject"}
                }
                sp_status = sp_tags.get(
                    self.dmarc_scan["dmarc"]["tags"]["sp"]["value"]
                )
                if sp_status is not None:
                    tags.update(sp_status)
            else:
                tags.update({"dmarc16": "SP-missing"})

            return tags
