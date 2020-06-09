dmarc_mock_data = {
    "dmarc_mock_data_dmarc2": {"dmarc": {"missing": True}},
    "dmarc_mock_data_dmarc3": {
        "dmarc": {"tags": {"p": {"value": "Missing", "explicit": True},}}
    },
    "dmarc_mock_data_dmarc4": {
        "dmarc": {"tags": {"p": {"value": "None", "explicit": True},}}
    },
    "dmarc_mock_data_dmarc5": {
        "dmarc": {"tags": {"p": {"value": "Quarantine", "explicit": True},}}
    },
    "dmarc_mock_data_dmarc6": {
        "dmarc": {"tags": {"p": {"value": "Reject", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc7": {
        "dmarc": {"tags": {"pct": {"value": 100, "explicit": True},},}
    },
    "dmarc_mock_data_dmarc8": {
        "dmarc": {"tags": {"pct": {"value": 80, "explicit": True}},}
    },
    "dmarc_mock_data_dmarc9": {
        "dmarc": {"tags": {"pct": {"value": "Invalid", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc10_dmarc_11": {
        "dmarc": {
            "tags": {
                "rua": {
                    "value": [
                        {
                            "scheme": "mailto",
                            "address": "dmarc@cyber.gc.ca",
                            "size_limit": None,
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
                        }
                    ],
                    "explicit": True,
                },
            },
        }
    },
    "dmarc_mock_data_dmarc12_dmarc_13": {
        "dmarc": {
            "tags": {
                "rua": {"value": [], "explicit": True},
                "ruf": {"value": [], "explicit": True},
            },
        }
    },
    "dmarc_mock_data_dmarc14": {
        "dmarc": {"record": "v=DMARC1;p=None;sp=None;rua=mailto:dmarc@cyber.gc.ca",}
    },
    "dmarc_mock_data_dmarc15": {"dmarc": {}},
    "dmarc_mock_data_dmarc16": {
        "dmarc": {"tags": {"sp": {"value": "Missing", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc17": {
        "dmarc": {"tags": {"sp": {"value": "None", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc18": {
        "dmarc": {"tags": {"sp": {"value": "Quarantine", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc19": {
        "dmarc": {"tags": {"sp": {"value": "Reject", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc20": {
        "dmarc": {"tags": {"pct": {"value": "None", "explicit": True},},}
    },
    "dmarc_mock_data_dmarc21": {
        "dmarc": {"tags": {"pct": {"value": 0, "explicit": True},},},
    },
}
