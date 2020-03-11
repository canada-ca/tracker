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

    value = graphene.String()

    with app.app_context():
        def resolve_value(self: Https_scans, info):
            tags = {}

            if "missing" in self.https_scan:
                return tags.update({"https2": "HTTPS-missing"})

            # Check Downgrade

            # Check bad chain
            if not self.https_scan["https"]["HTTPS Bad Chain"]:
                tags.update({"https4": "HTTPS-bad-chain"})

            # Check bad hostname

            # Check HTTPS enforced

            # Check for HSTS
            if not self.https_scan["https"]["HSTS"]:
                tags.update({"https8": "HSTS-missing"})

            # Check HSTS Age
            if not self.https_scan["https"]["HSTS Max Age"] < 31536000:
                tags.update({"https9": "HSTS-short-age"})

            # Check HSTS pre-load
            if self.https_scan["https"]["HSTS Preload Ready"] \
                and not self.https_scan["https"]["HSTS Preloaded"]:
                tags.update({"https10": "HSTS-preload-ready"})

            # Check HSTS preloaded
            if not self.https_scan["https"]["HSTS Preloaded"]:
                tags.update({"https11": "HSTS-not-preloaded"})

            # Check HTTPS Cert Expired
            if self.https_scan["https"]["HTTPS Expired Cert"]:
                tags.update({"https12": "HTTPS-certificate-expired"})

            # Check if HTTPS Cert is Self Signed
            if self.https_scan["https"]["HTTPS Self Signed Cert"]:
                tags.update({"https13": "HTTPS-certificate-self-signed"})

            return tags
