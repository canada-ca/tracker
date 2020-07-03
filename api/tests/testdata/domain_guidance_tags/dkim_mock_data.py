dkim_mock_data = {
    "dkim_mock_data_dkim2_1": {"dkim": {"missing": True}},
    "dkim_mock_data_dkim2_2": {"dkim": {"selector1._domainkey": {"missing": True},}},
    "dkim_mock_data_dkim5": {
        "dkim": {
            "selector1._domainkey": {
                "txt_record": {"k": "rsa",},
                "key_type": "rsa",
                "key_size": 100,
            }
        }
    },
    "dkim_mock_data_dkim6": {
        "dkim": {
            "selector1._domainkey": {
                "txt_record": {"k": "rsa",},
                "key_type": "rsa",
                "key_size": 1024,
            }
        }
    },
    "dkim_mock_data_dkim7": {
        "dkim": {
            "selector1._domainkey": {
                "txt_record": {"k": "rsa",},
                "key_type": "rsa",
                "key_size": 2048,
            }
        }
    },
    "dkim_mock_data_dkim8": {
        "dkim": {
            "selector1._domainkey": {
                "txt_record": {"k": "rsa",},
                "key_type": "rsa",
                "key_size": 4096,
            }
        }
    },
    "dkim_mock_data_dkim9": {"dkim": {"selector1._domainkey": {"key_size": None,}}},
    "dkim_mock_data_dkim10": {
        "dkim": {"selector1._domainkey": {"update-recommend": True}}
    },
    "dkim_mock_data_dkim11": {
        "dkim": {
            "selector1._domainkey": {
                "txt_record": {"k": "SHA256",},
                "key_type": "SHA256",
            }
        }
    },
    "dkim_mock_data_dkim12": {"dkim": {"selector1._domainkey": {"key_size": None,}}},
    "dkim_mock_data_dkim13": {"dkim": {"selector1._domainkey": {"t_value": True,}}},
}
