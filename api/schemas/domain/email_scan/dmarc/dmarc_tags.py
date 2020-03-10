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

            if "missing" in self.dmarc_scan:
                return tags.update({"dmarc2": "missing"})

            # Check P Policy Tag
            if self.dmarc_scan["dmarc"]["tags"]["p"]["value"] == "missing":
                tags.update({"dmarc3": "P-missing"})
            elif self.dmarc_scan["dmarc"]["tags"]["p"]["value"] == "none":
                tags.update({"dmarc4": "P-none"})
            elif self.dmarc_scan["dmarc"]["tags"]["p"]["value"] == "quarantine":
                tags.update({"dmarc5": "P-quarantine"})
            elif self.dmarc_scan["dmarc"]["tags"]["p"]["value"] == "reject":
                tags.update({"dmarc6": "P-reject"})

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

            # Check SP tag
            if self.dmarc_scan["dmarc"]["tags"]["sp"]["value"] == "missing":
                tags.update({"dmarc16": "SP-missing"})
            elif self.dmarc_scan["dmarc"]["tags"]["sp"]["value"] == "none":
                tags.update({"dmarc17": "SP-none"})
            elif self.dmarc_scan["dmarc"]["tags"]["sp"]["value"] == "quarantine":
                tags.update({"dmarc18": "SP-quarantine"})
            elif self.dmarc_scan["dmarc"]["tags"]["sp"]["value"] == "reject":
                tags.update({"dmarc19": "SP-reject"})

            return tags
