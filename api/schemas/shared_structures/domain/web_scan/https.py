import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Https_scans, Web_scans, Domains
from scalars.url import URL


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
        description="State of the HTTPS implementation on the server and any "
        "issues therein"
    )
    enforced = graphene.String(
        description="Degree to which HTTPS is enforced on the server based "
        "on behaviour"
    )
    hsts = graphene.String(
        description="Presence and completeness of HSTS implementation"
    )
    hsts_age = graphene.String(
        description="Denotes how long the domain should only be accessed using " "HTTPS"
    )
    preloaded = graphene.String(
        description="Denotes whether the domain has been submitted and "
        "included within HSTS preload list"
    )
    https_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan"
    )

    def resolve_domain(self: Https_scans, info, **kwargs):
        web_scan_domain_id = (
            db_session.query(Web_scans)
            .filter(Web_scans.id == self.id)
            .first()
            .domain_id
        )
        domain = (
            db_session.query(Domains)
            .filter(Domains.id == web_scan_domain_id)
            .first()
            .domain
        )
        return domain

    def resolve_timestamp(self: Https_scans, info, **kwargs):
        scan_date = (
            db_session.query(Web_scans)
            .filter(Web_scans.id == self.id)
            .first()
            .scan_date
        )
        return scan_date

    def resolve_implementation(self: Https_scans, info, **kwargs):
        implementation = self.https_scan.get("https", {}).get("implementation", None)
        return implementation

    def resolve_enforced(self: Https_scans, info, **kwargs):
        enforced = self.https_scan.get("https", {}).get("enforced", None)
        return enforced

    def resolve_hsts(self: Https_scans, info, **kwargs):
        hsts = self.https_scan.get("https", {}).get("hsts", None)
        return hsts

    def resolve_hsts_age(self: Https_scans, info, **kwargs):
        hsts_age = self.https_scan.get("https", {}).get("hsts_age", None)
        return hsts_age

    def resolve_preloaded(self: Https_scans, info, **kwargs):
        preloaded = self.https_scan.get("https", {}).get("preloaded", None)
        return preloaded

    def resolve_https_guidance_tags(self: Https_scans, info, **kwargs):
        tags = []

        if self.https_scan.get("https", {}).get("missing", None) is not None:
            tags.append("https2")
            return tags

        # Implementation
        implementation = self.https_scan.get("https", {}).get("implementation", None)

        if implementation is not None:
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

        if enforced is not None:
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

        if hsts is not None:
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

        if preload_status is not None:
            if isinstance(preload_status, str):
                preload_status = preload_status.lower()

            if preload_status == "hsts preload ready":
                tags.append("https11")
            elif preload_status == "hsts not preloaded":
                tags.append("https12")

        # Expired Cert
        expired_cert = self.https_scan.get("https", {}).get("expired_cert", None)

        if expired_cert is not None:
            if expired_cert is True:
                tags.append("https13")

        # Self Signed Cert
        self_signed_cert = self.https_scan.get("https", {}).get(
            "self_signed_cert", None
        )

        if self_signed_cert is not None:
            if self_signed_cert is True:
                tags.append("https14")

        return tags
