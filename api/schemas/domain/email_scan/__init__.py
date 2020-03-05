import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import Scans
from scalars.url import URL

from schemas.domain.email_scan.dmarc import DMARC
from schemas.domain.email_scan.spf import SPF
from schemas.domain.email_scan.shared_functions import get_timestamp, get_domain


class EmailScan(SQLAlchemyObjectType):
    class Meta:
        model = Scans
        interfaces = (relay.Node, )
        exclude_fields = (
            "id", "domain_id",
            "scan_date", "initiated_by"
        )
    domain = URL()
    timestamp = graphene.DateTime()
    dmarc = graphene.List(lambda: DMARC)
    spf = graphene.List(lambda: SPF)

    with app.app_context():
        def resolve_domain(self: Scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Scans, info):
            return get_timestamp(self, info)

        def resolve_dmarc(self: Scans, info):
            return DMARC.get_query(info).all()

        def resolve_spf(self: Scans, info):
            return SPF.get_query(info).all()


class EmailScanConnection(relay.Connection):
    class Meta:
        node = EmailScan
