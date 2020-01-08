# Mapping report/domain/organization field names to display names.

class MultiLingualString:
    def __init__(self, english, french) -> None:
        self.english = english
        self.french = french


LABELS = {
    # used in export CSVs
    "common": {
        "domain": MultiLingualString("Domain", "Domaine"),
        "canonical": MultiLingualString("URL", "URL"),
        "organization_name_en": MultiLingualString("English Organization", "Organisation anglaise"),
        "organization_name_fr": MultiLingualString("French Organization", "Organisation française"),
        "base_domain": MultiLingualString("Base Domain", "Domaine de base"),
        "sources": MultiLingualString("Sources", "Sources"),
    },
    "https": {
        "compliant": MultiLingualString("ITPIN Compliant", "Conforme à l'AMPTI"),
        "uses": MultiLingualString("Uses HTTPS", "Utilise HTTPS"),
        "enforces": MultiLingualString("Enforces HTTPS", "Exécute HTTPS"),
        "hsts": MultiLingualString("Strict Transport Security (HSTS)", "Strict Transport Security (HSTS)"),
        "preloaded": MultiLingualString("Preloaded", "Préchargés"),
        "bod_crypto": MultiLingualString("Free of known weak protocols and ciphers", "Absence de protocoles ou de suites de chiffrement ayant des vulnérabilités connues"),
        "hsts_age": MultiLingualString("HSTS max-age", "HSTS max-age"),
        "3des": MultiLingualString("3DES", "3DES"),
        "rc4": MultiLingualString("RC4", "RC4"),
        "sslv2": MultiLingualString("SSLv2", "SSLv2"),
        "sslv3": MultiLingualString("SSLv3", "SSLv3"),
        "accepted_ciphers": MultiLingualString("Only Uses Supported Ciphers", "Utilise des chiffrements supportés seulement"),
        "tlsv10": MultiLingualString("TLSv1.0", "TLSv1.0"),
        "tlsv11": MultiLingualString("TLSv1.1", "TLSv1.1"),
        "good_cert": MultiLingualString("Approved Certificate", "Certificats approuvés"),
        "signature_algorithm": MultiLingualString("Digital Signature Algorithm", "Digital Signature Algorithm"),
        "bad_ciphers": MultiLingualString("Unsupported TLS Cipher Suites", "Suites de chiffrement TLS non supportées"),
    },
}


NO = MultiLingualString("No", "Non")
YES = MultiLingualString("Yes", "Oui")
FIELD_MAPPING = {
    "common": {},
    "https": {
        "compliant": {
            0: NO,
            1: YES,
        },
        "uses": {
            -1: NO,
            0: NO,  # Downgrades HTTPS -> HTTP
            1: YES,  # (with certificate chain issues)
            2: YES,
        },
        "enforces": {
            0: NO,  # N/A (no HTTPS)
            1: NO,  # Present, not default
            2: YES,  # Defaults eventually to HTTPS
            3: YES,  # Defaults eventually + redirects immediately
        },
        "hsts": {
            -1: NO,  # N/A
            0: NO,  # No
            1: NO,  # No, HSTS with short max-age (for canonical endpoint)
            2: YES,  # Yes, HSTS for >= 1 year (for canonical endpoint)
            3: MultiLingualString("Preloaded", "Préchargés"),  # Yes, via preloading (subdomains only)
        },
        "good_cert": {
            -1: NO,
            0: NO,
            1: YES,
        },
        "preloaded": {0: NO, 1: MultiLingualString("Ready", "Prêt"), 2: YES},  # No  # Preload-ready  # Yes
        "bod_crypto": {-1: MultiLingualString("", ""), 0: NO, 1: YES},
    },
}

CSV_FIELDS = {
    "common": ["domain", "base_domain", "canonical", "organization_name_en", "organization_name_fr", "sources"],
    "https": [
        "compliant",
        "enforces",
        "hsts",
        "bod_crypto",
        "3des",
        "rc4",
        "sslv2",
        "sslv3",
        "accepted_ciphers",
        "tlsv10",
        "tlsv11",
        "good_cert",
        "signature_algorithm",
        "bad_ciphers",
        "preloaded",
    ],
}
