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

        if self.ssl_scan.get("missing", None) is not None:
            return tags.append({"ssl2": "missing"})

        # SSL-rc4
        ssl_rc4 = self.get('ssl', {}) \
            .get("rc4", None)
        if ssl_rc4:
            tags.append({"ssl4": "SSL-rc4"})

        # SSL-3des
        ssl_3des = self.get('ssl', {}) \
            .get("3des", None)
        if ssl_3des:
            tags.append({"ssl5": "SSL-3des"})

        # Signature Algorithm
        signature_algorithm = self.ssl_scan.get("ssl", {}) \
            .get("signature_algorithm", None)

        if isinstance(signature_algorithm, str):
            signature_algorithm = signature_algorithm.lower()

        if signature_algorithm == "sha-256" \
            or signature_algorithm == "sha-384" \
            or signature_algorithm == "aead":
            tags.append({"ssl7": "SSL-acceptable-certificate"})
        else:
            tags.append({"ssl8": "SSL-invalid-cipher"})

        # Heartbleed
        heart_bleed = self.ssl_scan.get("ssl", {}) \
            .get("heartbleed", None)

        if heart_bleed:
            tags.append({"ssl9": "Vulnerability-heartbleed"})

        # openssl ccs injection
        openssl_ccs_injection = self.ssl_scan.get("ssl", {}) \
            .get("openssl_ccs_injection", None)

        if openssl_ccs_injection:
            tags.append({"ssl10": "Vulnerability-ccs-injection"})

        return tags
