import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import Dmarc_scans, Scans, Domains

from scalars.url import URL

from schemas.domain.email_scan.dmarc.dmarc_record import DmarcRecord
from schemas.domain.email_scan.dmarc.pp_policy import PPPolicy
from schemas.domain.email_scan.dmarc.sp_policy import SPPolicy
from schemas.domain.email_scan.dmarc.pct import Pct
from schemas.domain.email_scan.dmarc.dmarc_tags import DmarcTags


class DMARC(SQLAlchemyObjectType):
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    id = graphene.ID()
    domain = URL
    timestamp = graphene.DateTime()
    record = graphene.List(lambda: DmarcRecord)
    p_policy = graphene.List(lambda: PPPolicy)
    sp_policy = graphene.List(lambda: SPPolicy)
    pct = graphene.List(lambda: Pct)
    dmarc_guidance_tags = graphene.List(lambda: DmarcTags)

    with app.app_context():
        def resolve_domain(self: Dmarc_scans, info):
            domain_id = db.session.query(Scans).filter(
                Scans.id == self.id
            ).options(load_only('domain_id')).first()
            domain = db.session.query(Domains).filter(
                Domains.id == domain_id.domain_id
            ).options(load_only('domain')).first()
            return domain.domain

        def resolve_timestamp(self: Dmarc_scans, info):
            timestamp = db.session.query(Scans).filter(
                Scans.id == self.id
            ).options(load_only('scan_date')).first()
            return timestamp.scan_date

        def resolve_record(self: Dmarc_scans, info):
            return DmarcRecord.get_query(info).all()

        def resolve_p_policy(self: Dmarc_scans, info):
            return PPPolicy.get_query(info).all()

        def resolve_sp_policy(self: Dmarc_scans, info):
            return SPPolicy.get_query(info).all()

        def resolve_pct(self: Dmarc_scans, info):
            return Pct.get_query(info).all()

        def resolve_dmarc_guidance_tags(self: Dmarc_scans, info):
            return DmarcTags.get_query(info).all()
