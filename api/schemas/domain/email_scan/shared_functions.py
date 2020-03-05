from sqlalchemy.orm import load_only

from db import db
from models import Scans, Domains


def get_domain(self, info):
    domain_id = db.session.query(Scans).filter(
        Scans.id == self.id
    ).options(load_only('domain_id')).first()
    domain = db.session.query(Domains).filter(
        Domains.id == domain_id.domain_id
    ).options(load_only('domain')).first()
    return domain.domain


def get_timestamp(self, info):
    timestamp = db.session.query(Scans).filter(
        Scans.id == self.id
    ).options(load_only('scan_date')).first()
    return timestamp.scan_date
