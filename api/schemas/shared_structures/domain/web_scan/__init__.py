import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Web_scans, Ssl_scans, Https_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
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

    def resolve_domain(self: Web_scans, info):
        return get_domain(self, info)

    def resolve_timestamp(self: Web_scans, info):
        return get_timestamp(self, info)

    def resolve_https(self: Web_scans, info):
        query = HTTPS.get_query(info)
        return query.filter(self.id == Https_scans.id).first()

    def resolve_ssl(self: Web_scans, info):
        query = SSL.get_query(info)
        return query.filter(self.id == Ssl_scans.id).first()


class WebScanConnection(relay.Connection):
    class Meta:
        node = WebScan
