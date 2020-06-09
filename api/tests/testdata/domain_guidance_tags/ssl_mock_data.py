ssl_mock_data = {
    "ssl_mock_data_ssl2": {"ssl": {"missing": True}},
    "ssl_mock_data_ssl3": {"ssl": {"rc4": True,}},
    "ssl_mock_data_ssl4": {"ssl": {"3des": True,}},
    "ssl_mock_data_ssl5": {
        "ssl": {"signature_algorithm": "SHA-256", "acceptable_certificate": True}
    },
    "ssl_mock_data_ssl6": {"ssl": {"signature_algorithm": "RSA",}},
    "ssl_mock_data_ssl7": {"ssl": {"heartbleed": True,}},
    "ssl_mock_data_ssl8": {"ssl": {"openssl_ccs_injection": True,}},
}
