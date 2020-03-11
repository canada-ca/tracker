import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Ssl_scans


class SSLTags(SQLAlchemyObjectType):
    class Meta:
        model = Ssl_scans
        exclude_fields = (
            "id",
            "ssl_scan"
        )
    value = graphene.String()

    with app.app_context():
        def resolve_value(self: Ssl_scans, info):
            tags = {}

            if "missing" in self.ssl_scan:
                return tags.update({"ssl2": "SSL-missing"})

            if self.ssl_scan["ssl"]["rc4"]:
                tags.update({"ssl4": "SSL-rc4"})

            if self.ssl_scan["ssl"]["3des"]:
                tags.update({"ssl5": "SSL-3des"})

            if self.ssl_scan["ssl"]["starttls"]:
                tags.update({"ssl6": "SSL-starttls"})

            # Check Ciphers

            if self.ssl_scan["ssl"]["heartbleed"]:
                tags.update({"ssl9": "Vulnerability-heartbleed"})

            if self.ssl_scan["ssl"]["openssl_ccs_injection"]:
                tags.update({"ssl10": "Vulnerability-ccs-injection"})

            return tags
