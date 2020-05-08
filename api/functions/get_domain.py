from sqlalchemy.orm import load_only

from db import db_session
from models import Scans, Domains


def get_domain(self, info):
    domain_id = (
        db_session.query(Scans)
        .filter(Scans.id == self.id)
        .options(load_only("domain_id"))
        .first()
    )
    domain = (
        db_session.query(Domains)
        .filter(Domains.id == domain_id.domain_id)
        .options(load_only("domain"))
        .first()
    )
    return domain.domain
