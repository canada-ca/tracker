dkim_mock_data = {
    "dkim_mock_data_dkim2": {"dkim": {"missing": True}},
    "dkim_mock_data_dkim5": {
        "dkim": {"txt_record": {"k": "rsa",}, "key_type": "rsa", "key_size": 100,}
    },
    "dkim_mock_data_dkim6": {
        "dkim": {"txt_record": {"k": "rsa",}, "key_type": "rsa", "key_size": 1024,}
    },
    "dkim_mock_data_dkim7": {
        "dkim": {"txt_record": {"k": "rsa",}, "key_type": "rsa", "key_size": 2048,}
    },
    "dkim_mock_data_dkim8": {
        "dkim": {"txt_record": {"k": "rsa",}, "key_type": "rsa", "key_size": 4096,}
    },
    "dkim_mock_data_dkim9": {"dkim": {"key_size": None,}},
    "dkim_mock_data_dkim10": {"dkim": {"update-recommend": True}},
    "dkim_mock_data_dkim11": {
        "dkim": {"txt_record": {"k": "SHA256",}, "key_type": "SHA256",}
    },
    "dkim_mock_data_dkim12": {"dkim": {"key_size": None,}},
    "dkim_mock_data_dkim13": {"dkim": {"t_value": True,}},
}
