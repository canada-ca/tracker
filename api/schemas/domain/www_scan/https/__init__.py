import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Https_scans
from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp

from schemas.domain.www_scan.https.https_tags import HTTPSTags


class HTTPS(SQLAlchemyObjectType):
    class Meta:
        model = Https_scans
        exclude_fields = (
            "id",
            "https_scan"
        )
    id = graphene.ID(description="The ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    implementation = graphene.String()
    enforced = graphene.String()
    hsts = graphene.String()
    hsts_age = graphene.String()
    preloaded = graphene.String()
    https_guidance_tags = graphene.List(lambda: HTTPSTags)

    with app.app_context():
        def resole_domain(self: Https_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Https_scans, info):
            return get_timestamp(self, info)

        def resolve_implementation(self: Https_scans, info):
            return self.https_scan["https"]["implementation"]

        def resolve_enforced(self: Https_scans, info):
            return self.https_scan["https"]["Domain Enforces HTTPS"]

        def resolve_hsts(self: Https_scans, info):
            return self.https_scan["https"]["HSTS"]

        def resolve_hsts_age(self: Https_scans, info):
            return self.https_scan["https"]["HSTS Max Age"]

        def resolve_preloaded(self: Https_scans, info):
            return self.https_scan["https"]["HSTS Preloaded"]

        def resolve_https_guidance_tags(self: Https_scans, info):
            return HTTPSTags.get_query(info).all()
