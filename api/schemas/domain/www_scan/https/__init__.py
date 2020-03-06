import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Https_scans
from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class HTTPS(SQLAlchemyObjectType):
    class Meta:
        model = Https_scans
        exclude_fields = (
            "id", "https_scan"
        )
    id = graphene.ID()
    domain = URL()
    timestamp = graphene.DateTime()
    implementation = graphene.String()
    enforced = graphene.String()
    hsts = graphene.String()
    hsts_age = graphene.String()
    preloaded = graphene.String()
    https_guidance_tags = graphene.List(lambda: HTTPS)

    with app.app_context():
        def resole_domain(self: Https_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Https_scans, info):
            return get_timestamp(self, info)

        def resolve_implementation(self: Https_scans, info):
            return self.https_scan["https"]["implementation"]

        def resolve_enforced(self: Https_scans, info):
            return self.https_scan["https"]["enforced"]

        def resolve_hsts(self: Https_scans, info):
            return self.https_scan["https"]["hsts"]

        def resolve_hsts_age(self: Https_scans, info):
            return self.https_scan["https"]["hsts_age"]

        def resolve_preloaded(self: Https_scans, info):
            return self.https_scan["https"]["preloaded"]

        def resolve_https_guidance_tags(self: Https_scans, info):
            return HTTPS.get_query(info).all()
