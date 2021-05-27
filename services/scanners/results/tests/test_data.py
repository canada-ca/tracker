https_result_data = {
    "hsts": "HSTS Fully Implemented",
    "enforced": "Strict",
    "hsts_age": 31536000,
    "expired_cert": False,
    "implementation": "Valid HTTPS",
    "preload_status": "HSTS Preload Ready",
    "self_signed_cert": False,
}

expected_negative_https_tags = []
expected_neutral_https_tags = ["https11"]
expected_positive_https_tags = []

ssl_result_data = {
    "SSL_2_0": False,
    "SSL_3_0": False,
    "TLS_1_0": False,
    "TLS_1_1": False,
    "TLS_1_2": True,
    "TLS_1_3": False,
    "heartbleed": False,
    "cipher_list": [
        "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
        "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
        "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384",
        "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256",
        "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256",
    ],
    "preferred_cipher": "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
    "supported_curves": [],
    "supports_ecdh_key_exchange": False,
    "signature_algorithm": "SHA256",
    "openssl_ccs_injection": False,
}

expected_negative_ssl_tags = []
expected_neutral_ssl_tags = []
expected_positive_ssl_tags = ["ssl5"]

dns_result_data = {
    "mx": {
        "hosts": [
            {
                "preference": 10,
                "hostname": "cyber-gc-ca.mail.protection.outlook.com",
                "addresses": ["104.47.60.36", "104.47.61.36"],
            }
        ],
        "warnings": [
            "The reverse DNS of 104.47.60.36 is 36.60.47.104.in-addr.arpa, but the A/AAAA DNS records for 36.60.47.104.in-addr.arpa do not resolve to 104.47.60.36",
            "The reverse DNS of 104.47.61.36 is 36.61.47.104.in-addr.arpa, but the A/AAAA DNS records for 36.61.47.104.in-addr.arpa do not resolve to 104.47.61.36",
        ],
    },
    "spf": {
        "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
        "valid": True,
        "dns_lookups": 5,
        "warnings": [],
        "parsed": {
            "pass": [
                {"value": "205.193.218.38", "mechanism": "a"},
                {"value": "205.193.218.37", "mechanism": "a"},
                {"value": "205.193.218.114", "mechanism": "a"},
                {"value": "205.193.218.115", "mechanism": "a"},
            ],
            "neutral": [],
            "softfail": [],
            "fail": [],
            "include": [
                {
                    "domain": "spf.protection.outlook.com",
                    "record": "v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/14 ip4:104.47.0.0/17 ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/48 include:spfd.protection.outlook.com -all",
                    "dns_lookups": 1,
                    "parsed": {
                        "pass": [
                            {"value": "40.92.0.0/15", "mechanism": "ip4"},
                            {"value": "40.107.0.0/16", "mechanism": "ip4"},
                            {"value": "52.100.0.0/14", "mechanism": "ip4"},
                            {"value": "104.47.0.0/17", "mechanism": "ip4"},
                            {"value": "2a01:111:f400::/48", "mechanism": "ip6"},
                            {"value": "2a01:111:f403::/48", "mechanism": "ip6"},
                        ],
                        "neutral": [],
                        "softfail": [],
                        "fail": [],
                        "include": [
                            {
                                "domain": "spfd.protection.outlook.com",
                                "record": "v=spf1 ip4:51.4.72.0/24 ip4:51.5.72.0/24 ip4:51.5.80.0/27 ip4:51.4.80.0/27 ip6:2a01:4180:4051:0800::/64 ip6:2a01:4180:4050:0800::/64 ip6:2a01:4180:4051:0400::/64 ip6:2a01:4180:4050:0400::/64 -all",
                                "dns_lookups": 0,
                                "parsed": {
                                    "pass": [
                                        {"value": "51.4.72.0/24", "mechanism": "ip4"},
                                        {"value": "51.5.72.0/24", "mechanism": "ip4"},
                                        {"value": "51.5.80.0/27", "mechanism": "ip4"},
                                        {"value": "51.4.80.0/27", "mechanism": "ip4"},
                                        {
                                            "value": "2a01:4180:4051:0800::/64",
                                            "mechanism": "ip6",
                                        },
                                        {
                                            "value": "2a01:4180:4050:0800::/64",
                                            "mechanism": "ip6",
                                        },
                                        {
                                            "value": "2a01:4180:4051:0400::/64",
                                            "mechanism": "ip6",
                                        },
                                        {
                                            "value": "2a01:4180:4050:0400::/64",
                                            "mechanism": "ip6",
                                        },
                                    ],
                                    "neutral": [],
                                    "softfail": [],
                                    "fail": [],
                                    "include": [],
                                    "redirect": None,
                                    "exp": None,
                                    "all": "fail",
                                },
                                "warnings": [],
                            }
                        ],
                        "redirect": None,
                        "exp": None,
                        "all": "fail",
                    },
                    "warnings": [],
                }
            ],
            "redirect": None,
            "exp": None,
            "all": "fail",
        },
    },
    "dmarc": {
        "record": "v=DMARC1; p=none; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
        "valid": True,
        "location": "cyber.gc.ca",
        "warnings": [],
        "tags": {
            "v": {"value": "DMARC1", "explicit": True},
            "p": {"value": "none", "explicit": True},
            "pct": {"value": 100, "explicit": True},
            "rua": {
                "value": [
                    {
                        "scheme": "mailto",
                        "address": "dmarc@cyber.gc.ca",
                        "size_limit": None,
                        "accepting": True,
                    }
                ],
                "explicit": True,
            },
            "ruf": {
                "value": [
                    {
                        "scheme": "mailto",
                        "address": "dmarc@cyber.gc.ca",
                        "size_limit": None,
                        "accepting": True,
                    }
                ],
                "explicit": True,
            },
            "fo": {"value": ["1"], "explicit": True},
            "adkim": {"value": "r", "explicit": False},
            "aspf": {"value": "r", "explicit": False},
            "rf": {"value": ["afrf"], "explicit": False},
            "ri": {"value": 86400, "explicit": False},
            "sp": {"value": "none", "explicit": False},
        },
    },
    "dkim": {
        "selector1": {
            "t_value": "null",
            "txt_record": {
                "v": "DKIM1",
                "k": "rsa",
                "p": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3rvAQg9bl72tae1RFu4zdx1ZE4E8VUbQfxDcm/x6YW2eNRdGg9cRSgqSLXmj4I+HQQ4GHFItn7Hb0ubGt6AJYMCvygbnnwFX2Skt+w/msnXzQOYY+NR6DEfL/4kwiDaawcDumvD2JfEXD3yCyPBoZStg1wf0a9KgLQQNe4aMREQIDAQAB",
            },
            "public_key_value": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3rvAQg9bl72tae1RFu4zdx1ZE4E8VUbQfxDcm/x6YW2eNRdGg9cRSgqSLXmj4I+HQQ4GHFItn7Hb0ubGt6AJYMCvygbnnwFX2Skt+w/msnXzQOYY+NR6DEfL/4kwiDaawcDumvD2JfEXD3yCyPBoZStg1wf0a9KgLQQNe4aMREQIDAQAB",
            "key_size": 1024,
            "key_type": "rsa",
            "public_key_modulus": 128986835293314190150497987524189448449432921513193192948873532904302192799974922792602624695895630642090219163581382671361079596067726465810188870659566753252627341029040386217423692275583904625222303885358524296924420382485253455698862760166022132727095317896399159035250651155696560064015533460599431434513,
            "public_exponent": 65537,
        }
    },
}

tls_guidance_data = {
    "ciphers": {
        "1.2": {
            "recommended": [
                "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_ECDSA_WITH_AES_256_CCM",
                "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
                "TLS_ECDHE_ECDSA_WITH_AES_128_CCM",
                "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
            ],
            "sufficient": [
                "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_DHE_DSS_WITH_AES_256_GCM_SHA384",
                "TLS_DHE_RSA_WITH_AES_256_CCM",
                "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256",
                "TLS_DHE_DSS_WITH_AES_128_GCM_SHA256",
                "TLS_DHE_RSA_WITH_AES_128_CCM",
                "TLS_ECDHE_ECDSA_WITH_AES_256_CCM_8",
                "TLS_ECDHE_ECDSA_WITH_AES_128_CCM_8",
                "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
                "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
                "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
                "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
                "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256",
                "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
            ],
            "phase_out": [
                "TLS_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_RSA_WITH_AES_128_GCM_SHA256",
                "TLS_RSA_WITH_AES_256_CBC_SHA256",
                "TLS_RSA_WITH_AES_256_CBC_SHA",
                "TLS_RSA_WITH_AES_128_CBC_SHA256",
                "TLS_RSA_WITH_AES_128_CBC_SHA",
                "TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA",
                "TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA",
                "TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA",
                "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
                "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
                "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
                "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
                "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
                "TLS_DHE_RSA_WITH_AES_128_CBC_SHA",
            ],
        },
        "1.3": {
            "recommended": [
                "TLS_AES_256_GCM_SHA384",
                "TLS_AES_128_GCM_SHA256",
                "TLS_AES_128_CCM_SHA256",
            ],
            "sufficient": ["TLS_AES_128_CCM_8_SHA256"],
        },
    },
    "curves": {
        "recommended": ["secp256r1", "secp384r1", "secp521r1"],
        "sufficient": [
            "ffdhe3072",
            "ffdhe4096",
            "ffdhe6144",
            "ffdhe8192",
            "sect283k1",
            "sect283r1",
            "sect409k1",
            "sect409r1",
            "sect571k1",
            "sect571r1",
        ],
        "phase_out": ["secp224r1", "sect233r1", "sect233k1", "ffdhe2048"],
    },
    "signature_algorithms": {
        "recommended": [
            "ecdsa_secp256r1_sha256",
            "ecdsa_secp384r1_sha384",
            "ecdsa_secp521r1_sha512",
            "rsa_pss_pss_sha256",
            "rsa_pss_pss_sha384",
            "rsa_pss_pss_sha512",
            "rsa_pss_rsae_sha256",
            "rsa_pss_rsae_sha384",
            "rsa_pss_rsae_sha512",
        ],
        "sufficient": ["rsa_pkcs1_sha256", "rsa_pkcs1_sha384", "rsa_pkcs1_sha512"],
        "phase_out": [
            "ecdsa_secp224r1_sha224",
            "rsa_pkcs1_sha224",
            "dsa_sha224",
            "dsa_sha256",
            "dsa_sha384",
            "dsa_sha512",
        ],
    },
    "extensions": {
        "1.2": {"recommended": [0, 3, 5, 10, 11, 13, 17, 18, 22, 23, 50, 65281]},
        "1.3": {"recommended": [0, 5, 10, 13, 18, 41, 43, 44, 45, 50, 51]},
    },
}

expected_negative_dmarc_tags = ["dmarc11"]
expected_neutral_dmarc_tags = ["dmarc10", "dmarc14", "dmarc17"]
expected_positive_dmarc_tags = ["dmarc23"]

expected_negative_spf_tags = []
expected_neutral_spf_tags = ["spf8"]
expected_positive_spf_tags = ["spf12"]

expected_negative_dkim_tags = []
expected_neutral_dkim_tags = ["dkim6"]
expected_positive_dkim_tags = []

expected_phase = "deploy"
