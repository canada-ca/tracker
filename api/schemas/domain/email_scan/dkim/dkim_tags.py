import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
import datetime
from dateutil.relativedelta import relativedelta

from app import app
from db import db
from models import (
    Scans,
    Dkim_scans,
    Mx_scans
)


class DkimTags(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = (
            "id",
            "dkim_scan"
        )

    value = graphene.String(description="Key tags found during scan")

    with app.app_context():
        def resolve_value(self: Dkim_scans, info):
            tags = {}

            # Check if DKIM scan is missing
            if 'missing' in self.dkim_scan["dkim"]:
                return tags.update({"dkim2": "missing"})

            # Check key type and key length
            if self.dkim_scan["dkim"]["key_size"] >= 4096 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim8": "P-4096"})
            elif self.dkim_scan["dkim"]["key_size"] == 2048 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim7": "P-2048"})
            elif self.dkim_scan["dkim"]["key_size"] == 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim6": "P-1024"})
            elif self.dkim_scan["dkim"]["key_size"] < 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim5": "P-sub1024"})
            else:
                tags.update({"dkim9": "P-invalid"})

            # Check to see if public key has been in use for more then one year
            if self.dkim_scan['dkim']['update-recommended']:
                tags.update({'dkim10': 'P-update-recommended'})

            # Check to see if key type is not rsa
            if self.dkim_scan['dkim']['key_type'] != "rsa":
                tags.update({'dkim11': 'Invalid-crypto'})

            # Check to see if length of key is too long
            if len(self.dkim_scan['dkim']['p']) > 255:
                if tags.get('dkim9') is not None:
                    tags.update({"dkim9": "P-invalid"})
                tags.update({'dkim12': 'DKIM-value-invalid'})

            if (self.dkim_scan['dkim']['txt_record'].get('v', None) is None) \
                and (self.dkim_scan['dkim']['txt_record'].get('k', None) is None) \
                and (self.dkim_scan['dkim']['txt_record'].get('p', None) is None):
                if tags.get('dkim12', None) is not None:
                    tags.update({'dkim12': 'DKIM-value-invalid'})

            # Check If T (Testing) Enabled
            if "t" in self.dkim_scan["dkim"]:
                tags.update({"dkim13": "T-enabled"})
