spf_mock_data = {
    "spf_mock_data_spf2": {
        "spf": {
            "missing": True
        }
    },
    "spf_mock_data_spf3": {
        "spf_mock_data_spf3_spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "missing"
            }
        },
        "spf_mock_data_spf3_dkim": {
            "dkim": {
                "txt_record": {
                    "a": "some.domain.ca",
                    "include": "some.other.domain"
                },
            }
        },
        "spf_mock_data_spf3_dmarc": {
            "dmarc": {
                "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            }
        },
    },
    "spf_mock_data_spf4": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "missing"
            }
        }
    },
    "spf_mock_data_spf5": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "Allow"
            }
        }
    },
    "spf_mock_data_spf6": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "Neutral"
            }
        }
    },
    "spf_mock_data_spf7": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com ~all",
            "parsed": {
                "all": "fail"
            }
        }
    },
    "spf_mock_data_spf8": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "fail"
            }
        }
    },
    "spf_mock_data_spf9": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "all": "redirect"
            }
        }
    },
    "spf_mock_data_spf10": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "all": "redirect"
            }
        }
    },
    "spf_mock_data_spf11": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "parsed": {
                "redirect": None,
                "exp": None,
                "all": "redirect"
            }
        }
    },
    "spf_mock_data_spf12": {
        "spf": {
            "dns_lookups": 15,
        }
    },
    "spf_mock_data_spf13": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca -all",
            "parsed": {
                "include": [
                    {
                        "domain": "spf.protection.outlook.com",
                    }
                ],
            }
        }
    }
}
