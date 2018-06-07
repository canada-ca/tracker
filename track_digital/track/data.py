
# Mapping report/domain/organization field names to display names.
LABELS = {
    # used in export CSVs
    "common": {
        "domain": "Domain",
        "canonical": "URL",
        "organization_name_en": "English Organization",
        "organization_name_fr": "French Organization",
        "base_domain": "Base Domain",
        "sources": "Sources",
        "total_domains": "Number of Domains",
    },
    "https": {
        "uses": "Uses HTTPS",
        "enforces": "Enforces HTTPS",
        "hsts": "Strict Transport Security (HSTS)",
        "preloaded": "Preloaded",
        "bod_crypto": "Free of RC4/3DES and SSLv2/SSLv3",
        "hsts_age": "HSTS max-age",
        "bod_organizations": "Free of RC4/3DES and SSLv2/SSLv3",
        "3des": "3DES",
        "rc4": "RC4",
        "sslv2": "SSLv2",
        "sslv3": "SSLv3",
        "tlsv10": "TLSv1.0",
        "tlsv11": "TLSv1.1",
    },
}


FIELD_MAPPING = {
    "common": {},
    "https": {
        "uses": {
            -1: "No",
            0: "No",  # Downgrades HTTPS -> HTTP
            1: "Yes",  # (with certificate chain issues)
            2: "Yes",
        },
        "enforces": {
            0: "No",  # N/A (no HTTPS)
            1: "No",  # Present, not default
            2: "Yes",  # Defaults eventually to HTTPS
            3: "Yes",  # Defaults eventually + redirects immediately
        },
        "hsts": {
            -1: "No",  # N/A
            0: "No",  # No
            1: "No",  # No, HSTS with short max-age (for canonical endpoint)
            2: "Yes",  # Yes, HSTS for >= 1 year (for canonical endpoint)
            3: "Preloaded",  # Yes, via preloading (subdomains only)
        },
        "preloaded": {0: "No", 1: "Ready", 2: "Yes"},  # No  # Preload-ready  # Yes
        "bod_crypto": {-1: "", 0: "No", 1: "Yes"},
    },
}

CSV_FIELDS = {
    "common": ["domain", "base_domain", "canonical", "organization_name_en", "organization_name_fr", "sources"],
    "https": [
        "enforces",
        "hsts",
        "bod_crypto",
        "3des",
        "rc4",
        "sslv2",
        "sslv3",
        "tlsv10",
        "tlsv11",
        "preloaded",
    ],
}
