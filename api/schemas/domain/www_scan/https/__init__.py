import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Https_scans
from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp

from schemas.domain.www_scan.https.https_tags import HTTPSTags


class HTTPS(SQLAlchemyObjectType):
    """
    A protocol used for securing messages sent using the Hypertext Transfer
    Protocol (HTTP), which forms the basis for the World Wide Web. Secure HTTP
    (S-HTTP) provides independently applicable security services for transaction
    confidentiality, authenticity/integrity and non-repudiability of origin.
    """
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
    enforced = graphene.String(
        description="Is HTTPS being enforced on this domain."
    )
    hsts = graphene.String(
        description="Is HTTP Strict Transport Security being used on this "
                    "domain."
    )
    hsts_age = graphene.Int(
        description="The time, in seconds, that the browser should remember "
                    "that a site is only to be accessed using HTTPS."
    )
    preloaded = graphene.String(
        description="Is HSTS Preloading enabled on this domain"
    )
    https_guidance_tags = graphene.List(
        lambda: HTTPSTags,
        description="Key tags found during HTTPS Scan"
    )

    with app.app_context():
        def resolve_domain(self: Https_scans, info):
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
            return self.https_scan["https"]["preload_status"]

        def resolve_https_guidance_tags(self: Https_scans, info):
            return HTTPSTags.get_query(info).all()
