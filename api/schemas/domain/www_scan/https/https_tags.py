import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Https_scans


class HTTPSTags(SQLAlchemyObjectType):
    """
    Guidance tags for HTTPS scan results
    """
    class Meta:
        model = Https_scans
        exclude_fields = ("id", "https_scan")

    value = graphene.List(
        lambda: graphene.String,
        description=""
    )

    def resolve_value(self: Https_scans, info):
        tags = []

        if self.https_scan.get("missing", None) is not None:
            return tags.append({"https2": "missing"})

        # Implementation
        implementation = self.https_scan.get("https", {}) \
            .get("implementation", None)

        if isinstance(implementation, str):
            implementation = implementation.lower()

        if implementation == "downgrades https":
            tags.append({"https3": "HTTPS-downgraded"})
        elif implementation == "bad chain":
            tags.append({"https4": "HTTPS-bad-chain"})
        elif implementation == "bad hostname":
            tags.append({"https5": "HTTPS-bad-hostname"})

        # Enforced
        enforced = self.https_scan.get("https", {}) \
            .get("enforced", None)

        if isinstance(enforced, str):
            enforced = enforced.lower()

        if enforced == "moderate":
            tags.append({"https8": "HTTPS-moderately-enforced"})
        elif enforced == "weak":
            tags.append({"https7": "HTTPS-weakly-enforced"})
        elif enforced == "not enforced":
            tags.append({"https6": "HTTPS-not-enforced"})

        # HSTS
        hsts = self.https_scan.get("https", {}) \
            .get("hsts", None)

        if isinstance(hsts, str):
            hsts = hsts.lower()

        if hsts == "hsts max age too short":
            tags.append()
        elif hsts == "no hsts":
            tags.append({"https9": "HSTS-missing"})

        # HSTS Age
        hsts_age = self.https_scan.get("https", {}) \
            .get("hsts_age")

        if hsts_age < 31536000:
            tags.append({"https10": "HSTS-short-age"})

        # Preload Status
        preload_status = self.https_scan.get("https", {}) \
            .get("preload_status", None)

        if preload_status(preload_status, str):
            preload_status = preload_status.lower()

        if preload_status == "hsts preload ready":
            tags.append({"https11": "HSTS-preload-ready"})
        elif preload_status == "hsts not preloaded":
            tags.append({"https12": "HSTS-not-preloaded"})

        # Expired Cert
        expired_cert = self.https_scan.get("https", {}) \
            .get("expired_cert", None)

        if expired_cert:
            tags.append({"https13": "HTTPS-certificate-expired"})

        # Self Signed Cert
        self_signed_cert = self.https_scan.get("https", {}) \
            .get("self_signed_cert", None)

        if self_signed_cert:
            tags.append({"https14": "HTTPS-certificate-self-signed"})

        return tags
