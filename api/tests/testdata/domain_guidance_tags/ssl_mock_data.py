ssl_mock_data_ssl2 = {
    "ssl": {
        "missing": True
    }
}

ssl_mock_data_ssl3 = {
    "ssl": {
        "rc4": True,
        "3des": True,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": False,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "SHA256",
        "openssl_ccs_injection": False,
        "acceptable_certificate": True
    }
}

ssl_mock_data_ssl4 = {
    "ssl": {
        "rc4": False,
        "3des": True,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": False,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "SHA256",
        "openssl_ccs_injection": False,
        "acceptable_certificate": True
    }
}

ssl_mock_data_ssl5 = {
    "ssl": {
        "rc4": False,
        "3des": False,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": False,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "SHA256",
        "openssl_ccs_injection": False,
        "acceptable_certificate": True
    }
}

ssl_mock_data_ssl6 = {
    "ssl": {
        "rc4": False,
        "3des": False,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": False,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "RSA",
        "openssl_ccs_injection": False,
        "acceptable_certificate": True
    }
}

ssl_mock_data_ssl7 = {
    "ssl": {
        "rc4": False,
        "3des": False,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": True,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "RSA",
        "openssl_ccs_injection": False,
        "acceptable_certificate": True
    }
}

ssl_mock_data_ssl8 = {
    "ssl": {
        "rc4": False,
        "3des": False,
        "SSL_2_0": False,
        "SSL_3_0": False,
        "TLS_1_0": False,
        "TLS_1_1": True,
        "TLS_1_2": True,
        "TLS_1_3": False,
        "heartbleed": False,
        "weak_ciphers": [
            "TLS_RSA_WITH_RC4_128_SHA",
            "TLS_RSA_WITH_RC4_128_MD5",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        ],
        "strong_ciphers": [],
        "preferred_cipher": None,
        "acceptable_ciphers": [
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_DHE_RSA_WITH_AES_128_CBC_SHA"
        ],
        "signature_algorithm": "RSA",
        "openssl_ccs_injection": True,
        "acceptable_certificate": True
    }
}
