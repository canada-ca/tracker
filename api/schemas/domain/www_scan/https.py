import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Https_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class HTTPS(SQLAlchemyObjectType):
    """
    Http Scan Object
    """
    class Meta:
        model = Https_scans
        exclude_fields = ("id", "https_scan")

    id = graphene.ID(description="The ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    implementation = graphene.String(
        description=""
    )
    enforced = graphene.String(
        description=""
    )
    hsts = graphene.String(
        description=""
    )
    hsts_age = graphene.String(
        description=""
    )
    preloaded = graphene.String(
        description=""
    )
    https_guidance_tags = graphene.List(
        lambda: graphene.String,
        description=""
    )

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
        tags = []

        if self.https_scan.get("https", {}).get("missing", None) is not None:
            tags.append("https2")
            return tags

        # Implementation
        implementation = self.https_scan.get("https", {}).get("implementation", None)

        if isinstance(implementation, str):
            implementation = implementation.lower()

        if implementation == "downgrades https":
            tags.append("https3")
        elif implementation == "bad chain":
            tags.append("https4")
        elif implementation == "bad hostname":
            tags.append("https5")

        # Enforced
        enforced = self.https_scan.get("https", {}).get("enforced", None)

        if isinstance(enforced, str):
            enforced = enforced.lower()

        if enforced == "moderate":
            tags.append("https8")
        elif enforced == "weak":
            tags.append("https7")
        elif enforced == "not enforced":
            tags.append("https6")

        # HSTS
        hsts = self.https_scan.get("https", {}).get("hsts", None)

        if isinstance(hsts, str):
            hsts = hsts.lower()

        if hsts == "hsts max age too short":
            tags.append("https10")
        elif hsts == "no hsts":
            tags.append("https9")

        # HSTS Age
        hsts_age = self.https_scan.get("https", {}).get("hsts_age", None)

        if hsts_age is not None:
            if hsts_age < 31536000 and "https" not in tags:
                tags.append("https10")

        # Preload Status
        preload_status = self.https_scan.get("https", {}).get("preload_status", None)

        if isinstance(preload_status, str):
            preload_status = preload_status.lower()

        if preload_status == "hsts preload ready":
            tags.append("https11")
        elif preload_status == "hsts not preloaded":
            tags.append("https12")

        # Expired Cert
        expired_cert = self.https_scan.get("https", {}).get("expired_cert", None)

        if expired_cert:
            tags.append("https13")

        # Self Signed Cert
        self_signed_cert = self.https_scan.get("https", {}).get(
            "self_signed_cert", None
        )

        if self_signed_cert:
            tags.append("https14")

        return tags
