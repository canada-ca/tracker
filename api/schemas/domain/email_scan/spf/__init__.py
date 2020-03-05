import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import Spf_scans, Scans, Domains

from scalars.url import URL

from schemas.domain.email_scan.shared_functions import get_timestamp, get_domain

from schemas.domain.email_scan.spf.spf_default import SPFDefault
from schemas.domain.email_scan.spf.spf_lookups import SPFLookups
from schemas.domain.email_scan.spf.spf_record import SPFRecord
from schemas.domain.email_scan.spf.spf_tags import SPFTags


class SPF(SQLAlchemyObjectType):
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    id = graphene.ID()
    domain = URL()
    timestamp = graphene.DateTime()
    lookups = graphene.List(lambda: SPFLookups)
    record = graphene.List(lambda: SPFRecord)
    spf_default = graphene.List(lambda: SPFDefault)
    spf_guidance_tags = graphene.List(lambda: SPFTags)

    with app.app_context():
        def resolve_domain(self: Spf_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Spf_scans, info):
            return get_timestamp(self, info)

        def resolve_lookups(self: Spf_scans, info):
            return SPFLookups.get_query(info).all()

        def resolve_record(self: Spf_scans, info):
            return SPFRecord.get_query(info).all()

        def resolve_spf_default(self: Spf_scans, info):
            return SPFDefault.get_query(info).all()

        def resolve_spf_guidance_tags(self: Spf_scans, info):
            return SPFTags.get_query(info).all()
