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

            if 'missing' in self.https_scan["https"]:
                return tags.update({"https2": "HTTPS-missing"})

            # Check Implementation Tags
            implementation_tags = {
                "Downgrades HTTPS": {"https3": "HTTPS-downgraded"},
                "Valid HTTPS": {"dsa": "dsa"},
                "Bad Chain": {"https4": "HTTPS-bad-chain"},
                "Bad Hostname": {"https5": "HTTPS-bad-hostname"}
            }
            implementation_status = implementation_tags.get(
                self.https_scan["https"]["implementation"]
            )
            if implementation_status is not None:
                tags.update(implementation_status)

            # Check Enforcement
            enforced_tags = {
                "Not Enforced": {"fds": "fsfd"},
                "Strict": {"fs": "fds"},
                "Moderate": {"https7": "HTTPS-moderately-enforced"},
                "Weak": {"https6": "HTTPS-weakly-enforced"}
            }
            enforced_status = enforced_tags.get(
                    self.https_scan["https"]["enforced"]
                )
            if enforced_status is not None:
                tags.update(enforced_status)

            # Check HSTS
            hsts_tags = {
                "No HSTS": {"https8": "HSTS-missing"},
                "HSTS Fully Implemented": {"dsa", "fs"},
                "HSTS Max Age Too Short": {"https9": "HSTS-short-age"},
            }
            hsts_status = hsts_tags.get(
                self.https_scan["https"]["hsts"]
            )
            if hsts_status is not None:
                tags.update(hsts_status)

            # Check Preload
            preload_tags = {
                "HSTS Preloaded": {"fds": "fdsf"},
                "HSTS Preload Ready": {"https10": "HSTS-preload-ready"},
                "HSTS Not Preloaded": {"https11": "HSTS-not-preloaded"}
            }
            preload_status = preload_tags.get(
                self.https_scan["https"]["preload_status"]
            )
            if preload_status is not None:
                tags.update(preload_status)

            # Check HTTPS Cert Expired
            if self.https_scan["https"]["expired_cert"]:
                tags.update({"https12": "HTTPS-certificate-expired"})

            # Check if HTTPS Cert is Self Signed
            if self.https_scan["https"]["self_signed_cert"]:
                tags.update({"https13": "HTTPS-certificate-self-signed"})

            return tags
