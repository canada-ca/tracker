import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Scans, Ssl_scans, Https_scans
from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp

from schemas.domain.www_scan.https import HTTPS
from schemas.domain.www_scan.ssl import SSL


class WWWScan(SQLAlchemyObjectType):
    """
    Results of HTTPS and SSL scans on domain
    """
    class Meta:
        model = Scans
        interfaces = (relay.Node,)
        exclude_fields = (
            "id",
            "domain_id",
            "scan_date",
            "initiated_by"
        )
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    https = graphene.List(
        lambda: HTTPS,
        description="Hyper Text Transfer Protocol Secure"
    )
    ssl = graphene.List(lambda: SSL)

    with app.app_context():
        def resolve_domain(self: Scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Scans, info):
            return get_timestamp(self, info)

        def resolve_https(self: Scans, info):
            query = HTTPS.get_query(info)
            return query.filter(self.id == Https_scans.id).all()

        def resolve_ssl(self: Scans, info):
            query = SSL.get_query(info)
            return query.filter(self.id == Ssl_scans.id).all()


class WWWScanConnection(relay.Connection):
    class Meta:
        node = WWWScan
