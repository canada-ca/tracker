import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Ssl_scans


class SSLTags(SQLAlchemyObjectType):
    """
    Guidance tags for HTTPS scan results
    """
    class Meta:
        model = Ssl_scans
        exclude_fields = ("id", "ssl_scan")

    value = graphene.List(
        lambda: graphene.String,
        description=""
    )

    def resolve_value(self: Ssl_scans, info):
        tags = []

        if self.ssl_scan.get("ssl", {}).get("missing", None) is not None:
            tags.append({"ssl2": "SSL-missing"})
            return tags

        # SSL-rc4
        ssl_rc4 = self.ssl_scan.get('ssl', {}) \
            .get("rc4", None)
        if ssl_rc4 is True:
            tags.append({"ssl3": "SSL-rc4"})

        # SSL-3des
        ssl_3des = self.ssl_scan.get('ssl', {}) \
            .get("3des", None)
        if ssl_3des is True:
            tags.append({"ssl4": "SSL-3des"})

        # Signature Algorithm
        signature_algorithm = self.ssl_scan.get("ssl", {}) \
            .get("signature_algorithm", None)

        if isinstance(signature_algorithm, str):
            signature_algorithm = signature_algorithm.lower()

        if signature_algorithm == "sha-256" \
            or signature_algorithm == "sha-384" \
            or signature_algorithm == "aead":
            tags.append({"ssl5": "SSL-acceptable-certificate"})
        else:
            tags.append({"ssl6": "SSL-invalid-cipher"})

        # Heartbleed
        heart_bleed = self.ssl_scan.get("ssl", {}) \
            .get("heartbleed", None)

        if heart_bleed is True:
            tags.append({"ssl7": "Vulnerability-heartbleed"})

        # openssl ccs injection
        openssl_ccs_injection = self.ssl_scan.get("ssl", {}) \
            .get("openssl_ccs_injection", None)

        if openssl_ccs_injection is True:
            tags.append({"ssl8": "Vulnerability-ccs-injection"})

        return tags
