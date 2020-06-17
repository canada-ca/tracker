from sqlalchemy.orm import load_only

from db import db_session
from models import Web_scans, Mail_scans, Domains


def get_domain(self, info):
    domain_id = (
        db_session.query(Web_scans)
        .filter(Web_scans.id == self.id)
        .options(load_only("domain_id"))
        .first()
    )

    if domain_id is None:
        domain_id = (
            db_session.query(Mail_scans)
            .filter(Mail_scans.id == self.id)
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
