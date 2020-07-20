import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Web_scans, Ssl_scans, Https_scans, Domains
from scalars.url import URL
from schemas.shared_structures.domain.web_scan.https import HTTPS
from schemas.shared_structures.domain.web_scan.ssl import SSL


class WebScan(SQLAlchemyObjectType):
    """
    Results of HTTPS and SSL scans on domain
    """

    class Meta:
        model = Web_scans
        interfaces = (relay.Node,)
        exclude_fields = ("id", "domain_id", "scan_date", "initiated_by")

    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    https = graphene.Field(lambda: HTTPS)
    ssl = graphene.Field(lambda: SSL)

    def resolve_domain(self: Web_scans, info, **kwargs):
        domain = (
            db_session.query(Domains)
            .filter(Domains.id == self.domain_id)
            .first()
            .domain
        )
        return domain

    def resolve_timestamp(self: Web_scans, info, **kwargs):
        return self.scan_date

    def resolve_https(self: Web_scans, info, **kwargs):
        query = HTTPS.get_query(info)
        query = query.filter(self.id == Https_scans.id).first()
        return query

    def resolve_ssl(self: Web_scans, info, **kwargs):
        query = SSL.get_query(info)
        query = query.filter(self.id == Ssl_scans.id).first()
        return query


class WebScanConnection(relay.Connection):
    class Meta:
        node = WebScan
