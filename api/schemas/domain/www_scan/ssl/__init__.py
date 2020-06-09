import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Ssl_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
from schemas.domain.www_scan.ssl.ssl_tags import SSLTags


class SSL(SQLAlchemyObjectType):
    """
    SSL Scan Object
    """
    class Meta:
        model = Ssl_scans
        exclude_fields = ("id", "ssl_scan")

    id = graphene.ID()
    domain = URL()
    timestamp = graphene.DateTime()
    ssl_guidance_tags = graphene.Field(lambda: SSLTags)

    def resolve_domain(self, info):
        return get_domain(self, info)

    def resolve_timestamp(self, info):
        return get_timestamp(self, info)

    def resolve_ssl_guidance_tags(self: Ssl_scans, info):
        return SSLTags.get_query(info).first()
