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
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    dmarc = graphene.List(
        lambda: DMARC,
        description="Domain-based Message Authentication, Reporting, "
                    "and Conformance (DMARC) "
    )
    spf = graphene.List(
        lambda: SPF,
        description="Sender Policy Framework (SPF) for Authorizing Use of "
                    "Domains in Email "
    )

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
