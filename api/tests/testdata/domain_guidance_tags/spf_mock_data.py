spf_mock_data = {
    "spf_mock_data_spf2": {
        "spf": {
            "missing": True
        }
    },
    "spf_mock_data_spf3": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "fail"
            }
        }
    },
    "spf_mock_data_spf4": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "missing"
            }
        }
    },
    "spf_mock_data_spf5": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "Allow"
            }
        }
    },
    "spf_mock_data_spf6": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "Neutral"
            }
        }
    },
    "spf_mock_data_spf7": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com ~all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "fail"
            }
        }
    },
    "spf_mock_data_spf8": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "fail"
            }
        }
    },
    "spf_mock_data_spf9": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "redirect"
            }
        }
    },
    "spf_mock_data_spf10": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 5,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "redirect"
            }
        }
    },
    "spf_mock_data_spf11": {
        "spf": {
            "record": "v=spf1 a:Cranberry.cse-cst.gc.ca a:beechnut.cse-cst.gc.ca a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
            "valid": True,
            "dns_lookups": 15,
            "warnings": [],
            "parsed": {
                "pass": [
                    {
                        "value": "205.193.218.38",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.37",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.114",
                        "mechanism": "a"
                    },
                    {
                        "value": "205.193.218.115",
                        "mechanism": "a"
                    }
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
                                {
                                    "value": "40.92.0.0/15",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "40.107.0.0/16",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "52.100.0.0/14",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "104.47.0.0/17",
                                    "mechanism": "ip4"
                                },
                                {
                                    "value": "2a01:111:f400::/48",
                                    "mechanism": "ip6"
                                },
                                {
                                    "value": "2a01:111:f403::/48",
                                    "mechanism": "ip6"
                                }
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
                                            {
                                                "value": "51.4.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.72.0/24",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.5.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "51.4.80.0/27",
                                                "mechanism": "ip4"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0800::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4051:0400::/64",
                                                "mechanism": "ip6"
                                            },
                                            {
                                                "value": "2a01:4180:4050:0400::/64",
                                                "mechanism": "ip6"
                                            }
                                        ],
                                        "neutral": [],
                                        "softfail": [],
                                        "fail": [],
                                        "include": [],
                                        "redirect": None,
                                        "exp": None,
                                        "all": "fail"
                                    },
                                    "warnings": []
                                }
                            ],
                            "redirect": None,
                            "exp": None,
                            "all": "fail"
                        },
                        "warnings": []
                    }
                ],
                "redirect": None,
                "exp": None,
                "all": "redirect"
            }
        }
    }
}
