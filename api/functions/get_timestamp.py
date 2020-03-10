from sqlalchemy.orm import load_only

from db import db
from models import Scans, Domains

def get_timestamp(self, info):
    timestamp = db.session.query(Scans).filter(
        Scans.id == self.id
    ).options(load_only('scan_date')).first()
    return timestamp.scan_date
