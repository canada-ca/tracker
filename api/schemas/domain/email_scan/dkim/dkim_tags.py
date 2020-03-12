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

            if 'missing' in self.dkim_scan["dkim"]:
                return tags.update({"dkim2": "missing"})

            if self.dkim_scan["dkim"]["key_size"] >= 4096 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim8": "P-4096"})
            elif self.dkim_scan["dkim"]["key_size"] == 2048 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim5": "P-2048"})
            elif self.dkim_scan["dkim"]["key_size"] == 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim4": "P-1024"})
            elif self.dkim_scan["dkim"]["key_size"] < 1024 \
            and self.dkim_scan["dkim"]["key_type"] == "rsa":
                tags.update({"dkim3": "P-sub1024"})
            else:
                tags.update({"dkim6": "P-invalid"})

            # Get Current Scan Timestamp
            current_scan = db.session.query(Scans).filter(
                Scans.id == self.id
            ).first()

            # Get One Year Difference
            curr_date_time = datetime.datetime.fromtimestamp(
                current_scan.scan_date)
            pre_date_time = curr_date_time - relativedelta(years=1)

            # Get all scans in one year range
            scans = db.session.query(Scans).filter(
                Scans.scan_date < curr_date_time
            ).filter(
                Scans.scan_date >= pre_date_time
            ).all()

            # Get the current modulus for checking and assign bool check
            curr_modulus = self.dkim_scan["dkim"]["modulus"]
            needs_rotation = True

            # Loop through all the scans and compare their modulus
            for scan in scans:
                check_modulus = db.session.query(Dkim_scans).filter(
                    Dkim_scans.id == scan.id
                ).first()
                if curr_modulus != check_modulus.dkim_scan["dkim"]["modulus"]:
                    needs_rotation = False

            if needs_rotation:
                tags.update({"dkim10": "P-update-recommended"})
