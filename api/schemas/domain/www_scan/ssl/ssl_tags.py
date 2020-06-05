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

# {
#     "ssl": {
#         "rc4": true,
#         "3des": true,
#         "SSL_2_0": false,
#         "SSL_3_0": false,
#         "TLS_1_0": false,
#         "TLS_1_1": true,
#         "TLS_1_2": true,
#         "TLS_1_3": false,
#         "heartbleed": false,
#         "weak_ciphers": [
#             "TLS_RSA_WITH_RC4_128_SHA",
#             "TLS_RSA_WITH_RC4_128_MD5",
#             "TLS_RSA_WITH_AES_256_CBC_SHA",
#             "TLS_RSA_WITH_AES_128_CBC_SHA",
#             "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
#         ],
#         "strong_ciphers": [
#
#         ],
#         "preferred_cipher": null,
#         "acceptable_ciphers": [
#             "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
#             "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
#             "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
#             "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
#         ],
#         "signature_algorithm": "SHA256",
#         "openssl_ccs_injection": false,
#         "acceptable_certificate": true
#     }
# }
