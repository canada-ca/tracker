import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Ssl_scans

from scalars.url import URL

from schemas.domain.www_scan.ssl.ssl_tags import SSLTags

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class SSL(SQLAlchemyObjectType):
    class Meta:
        model = Ssl_scans
        exclude_fields = (
            "id",
            "ssl_scan"
        )
    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    ssl_version = graphene.String(description="Version of SSL being ran")
    tls_version = graphene.String(description="Version of TLS being ran")
    ssl_guidance_tags = graphene.List(
        lambda: SSLTags,
        description="Key tags found during SSL scan"
    )

    with app.app_context():
        def resolve_domain(self: Ssl_scans, info):
            return get_domain(self, info)

        def resolve_timestamp(self: Ssl_scans, info):
            return get_timestamp(self, info)

        def resolve_ssl_version(self: Ssl_scans, info):
            if self.ssl_scan["ssl"]["sslv2"]:
                return "SSL Version 2"
            elif self.ssl_scan["ssl"]["sslv3"]:
                return "SSL Version 3"

        def resolve_tls_version(self: Ssl_scans, info):
            if self.ssl_scan["ssl"]["tlsv1_0"]:
                return "TLS Version 1.0"
            elif self.ssl_scan["ssl"]["tlsv1_1"]:
                return "TLS Version 1.1"
            elif self.ssl_scan["ssl"]["tlsv1_2"]:
                return "TLS Version 1.2"
            elif self.ssl_scan["ssl"]["tlsv1_3"]:
                return "TLS Version 1.3"

        def resolve_ssl_guidance_tags(self: Ssl_scans, info):
            return SSLTags.get_query(info).all()


# tags = {
#     "ssl": {
#         "rc4": true,
#         "3des": true,
#         "sslv2": true,
#         "sslv3": true,
#         "tlsv1_0": true,
#         "tlsv1_1": true,
#         "tlsv1_2": true,
#         "tlsv1_3": true,
#         "starttls": true,
#         "good_cert": true,
#         "bod_crypto": "True",
#         "heartbleed": true,
#         "used_ciphers": [
#             "SHA256"
#         ],
#         "signature_algorithm": "SHA256",
#         "openssl_ccs_injection": true
#     }
# }
