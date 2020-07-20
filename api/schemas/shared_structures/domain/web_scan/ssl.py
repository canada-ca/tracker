import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Ssl_scans, Domains, Web_scans
from scalars.url import URL


class SSL(SQLAlchemyObjectType):
    """
    SSL Scan Object
    """

    class Meta:
        model = Ssl_scans
        exclude_fields = ("id", "ssl_scan")

    id = graphene.ID(description="The ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="The time the scan was initiated")
    ssl_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan"
    )

    def resolve_domain(self, info, **kwargs):
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

    def resolve_timestamp(self, info, **kwargs):
        scan_date = (
            db_session.query(Web_scans)
            .filter(Web_scans.id == self.id)
            .first()
            .scan_date
        )
        return scan_date

    def resolve_ssl_guidance_tags(self: Ssl_scans, info, **kwargs):
        tags = []

        if self.ssl_scan.get("ssl", {}).get("missing", None) is not None:
            tags.append("ssl2")
            return tags

        # SSL-rc4
        ssl_rc4 = self.ssl_scan.get("ssl", {}).get("rc4", None)
        if ssl_rc4 is not None:
            if ssl_rc4 is True:
                tags.append("ssl3")

        # SSL-3des
        ssl_3des = self.ssl_scan.get("ssl", {}).get("3des", None)
        if ssl_3des is not None:
            if ssl_3des is True:
                tags.append("ssl4")

        # Signature Algorithm
        signature_algorithm = self.ssl_scan.get("ssl", {}).get(
            "signature_algorithm", None
        )

        if signature_algorithm is not None:
            if isinstance(signature_algorithm, str):
                signature_algorithm = signature_algorithm.lower()

            if (
                signature_algorithm == "sha-256"
                or signature_algorithm == "sha-384"
                or signature_algorithm == "aead"
            ):
                tags.append("ssl5")
            else:
                tags.append("ssl6")
        else:
            tags.append("ssl6")

        # Heartbleed
        heart_bleed = self.ssl_scan.get("ssl", {}).get("heartbleed", None)

        if heart_bleed is not None:
            if heart_bleed is True:
                tags.append("ssl7")

        # openssl ccs injection
        openssl_ccs_injection = self.ssl_scan.get("ssl", {}).get(
            "openssl_ccs_injection", None
        )

        if openssl_ccs_injection is not None:
            if openssl_ccs_injection is True:
                tags.append("ssl8")

        return tags
