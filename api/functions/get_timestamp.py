from sqlalchemy.orm import load_only

from db import db_session
from models import Web_scans, Mail_scans, Domains


def get_timestamp(self, info):
    timestamp = (
        db_session.query(Web_scans)
        .filter(Web_scans.id == self.id)
        .options(load_only("scan_date"))
        .first()
    )

    if timestamp is None:
        timestamp = (
            db_session.query(Mail_scans)
            .filter(Mail_scans.id == self.id)
            .options(load_only("scan_date"))
            .first()
        )

    return timestamp.scan_date
