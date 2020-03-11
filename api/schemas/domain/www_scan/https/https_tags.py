import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Https_scans


class HTTPSTags(SQLAlchemyObjectType):
    class Meta:
        model = Https_scans
        exclude_fields = (
            "id",
            "https_scan"
        )

    value = graphene.String(description="Important tags retrieved during scan")

    with app.app_context():
        def resolve_value(self: Https_scans, info):
            tags = {}

            if self.https_scan["https"]["missing"]:
                return tags.update({"https2": "HTTPS-missing"})

            implementation_tags = {
                "Downgrades HTTPS": {"https3": "HTTPS-downgraded"},
                "Valid HTTPS":
            }
            if self.https_scan["https"]["implementation"]

            # Check for HSTS
            if not self.https_scan["https"]["hsts"]:
                tags.update({"https8": "HSTS-missing"})

            # Check HSTS Age
            if not self.https_scan["https"]["hsts_age"] < 31536000:
                tags.update({"https9": "HSTS-short-age"})

            # Check HSTS preload status
            if self.https_scan["https"]["preloaded_status"]:
                tags.update({"https10": "HSTS-preload-ready"})

            # Check HTTPS Cert Expired
            if self.https_scan["https"]["HTTPS Expired Cert"]:
                tags.update({"https12": "HTTPS-certificate-expired"})

            # Check if HTTPS Cert is Self Signed
            if self.https_scan["https"]["HTTPS Self Signed Cert"]:
                tags.update({"https13": "HTTPS-certificate-self-signed"})

            return tags
