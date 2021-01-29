import pytest


@pytest.fixture
def all_domains_input():
    return {
        "findMyOrganizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "ABC",
                        "domains": {
                            "edges": [
                                {"node": {"domain": "abc.def.ca"}},
                                {"node": {"domain": "test-test.cd.ca"}},
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "DEF",
                        "domains": {
                            "edges": [
                                {"node": {"domain": "qwe-rty.com"}},
                                {"node": {"domain": "foo.bar.baz"}},
                                {"node": {"domain": "fizz-buzz.bang"}},
                                {"node": {"domain": "xyz-abc-mn.net"}},
                            ]
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "GHI",
                        "domains": {
                            "edges": [
                                {"node": {"domain": "abcdef.xyz"}},
                            ]
                        },
                    }
                },
            ]
        }
    }


@pytest.fixture
def name_domain_input():
    return {
        "findOrganizationBySlug": {
            "domains": {
                "edges": [
                    {"node": {"domain": "qwe-rty.com"}},
                    {"node": {"domain": "foo.bar.baz"}},
                    {"node": {"domain": "fizz-buzz.bang"}},
                    {"node": {"domain": "xyz-abc-mn.net"}},
                ]
            }
        }
    }


@pytest.fixture
def monthly_dmarc_input():
    return {
        "findDomainByDomain": {
            "domain": "abc-def.ghi",
            "dmarcSummaryByPeriod": {
                "month": "NOVEMBER",
                "year": "2020",
                "categoryPercentages": {
                    "fullPassPercentage": 86.76,
                    "passSpfOnlyPercentage": 0.03,
                    "passDkimOnlyPercentage": 5.59,
                    "failPercentage": 7.62,
                    "totalMessages": 12663,
                },
            },
        }
    }


@pytest.fixture
def yearly_dmarc_input():
    return {
        "findDomainByDomain": {
            "domain": "abc-def.ghi",
            "yearlyDmarcSummaries": [
                {
                    "month": "JANUARY",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 95.15,
                        "passSpfOnlyPercentage": 0,
                        "passDkimOnlyPercentage": 3.64,
                        "failPercentage": 1.21,
                        "totalMessages": 3136,
                    },
                },
                {
                    "month": "FEBRUARY",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 95.52,
                        "passSpfOnlyPercentage": 0,
                        "passDkimOnlyPercentage": 2.89,
                        "failPercentage": 1.59,
                        "totalMessages": 11272,
                    },
                },
                {
                    "month": "MARCH",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 95.2,
                        "passSpfOnlyPercentage": 0.01,
                        "passDkimOnlyPercentage": 1.91,
                        "failPercentage": 2.88,
                        "totalMessages": 25112,
                    },
                },
                {
                    "month": "APRIL",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 90.7,
                        "passSpfOnlyPercentage": 0.55,
                        "passDkimOnlyPercentage": 1.59,
                        "failPercentage": 7.16,
                        "totalMessages": 28800,
                    },
                },
                {
                    "month": "MAY",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 93.72,
                        "passSpfOnlyPercentage": 0.01,
                        "passDkimOnlyPercentage": 3.54,
                        "failPercentage": 2.73,
                        "totalMessages": 24393,
                    },
                },
                {
                    "month": "JUNE",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 94.3,
                        "passSpfOnlyPercentage": 0.02,
                        "passDkimOnlyPercentage": 3.9,
                        "failPercentage": 1.77,
                        "totalMessages": 21035,
                    },
                },
                {
                    "month": "JULY",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 91.49,
                        "passSpfOnlyPercentage": 0.01,
                        "passDkimOnlyPercentage": 5.95,
                        "failPercentage": 2.55,
                        "totalMessages": 15255,
                    },
                },
                {
                    "month": "AUGUST",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 88.81,
                        "passSpfOnlyPercentage": 0,
                        "passDkimOnlyPercentage": 7.83,
                        "failPercentage": 3.36,
                        "totalMessages": 13051,
                    },
                },
                {
                    "month": "SEPTEMBER",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 88.6,
                        "passSpfOnlyPercentage": 0.05,
                        "passDkimOnlyPercentage": 4.79,
                        "failPercentage": 6.56,
                        "totalMessages": 15072,
                    },
                },
                {
                    "month": "OCTOBER",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 87.8,
                        "passSpfOnlyPercentage": 0.01,
                        "passDkimOnlyPercentage": 4.64,
                        "failPercentage": 7.56,
                        "totalMessages": 14152,
                    },
                },
                {
                    "month": "NOVEMBER",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 86.76,
                        "passSpfOnlyPercentage": 0.03,
                        "passDkimOnlyPercentage": 5.59,
                        "failPercentage": 7.62,
                        "totalMessages": 12663,
                    },
                },
                {
                    "month": "DECEMBER",
                    "year": "2020",
                    "categoryPercentages": {
                        "fullPassPercentage": 89.88,
                        "passSpfOnlyPercentage": 0.02,
                        "passDkimOnlyPercentage": 6.43,
                        "failPercentage": 3.68,
                        "totalMessages": 10598,
                    },
                },
                {
                    "month": "JANUARY",
                    "year": "2021",
                    "categoryPercentages": {
                        "fullPassPercentage": 92.59,
                        "passSpfOnlyPercentage": 0.01,
                        "passDkimOnlyPercentage": 4.83,
                        "failPercentage": 2.57,
                        "totalMessages": 11617,
                    },
                },
            ],
        }
    }


@pytest.fixture
def all_summaries_input():
    return {
        "findMyOrganizations": {
            "edges": [
                {
                    "node": {
                        "acronym": "ABC",
                        "domainCount": 6,
                        "summaries": {
                            "web": {
                                "total": 6,
                                "categories": [
                                    {"name": "pass", "count": 0, "percentage": 0},
                                    {"name": "fail", "count": 6, "percentage": 100},
                                ],
                            },
                            "mail": {
                                "total": 6,
                                "categories": [
                                    {"name": "pass", "count": 4, "percentage": 66.7},
                                    {"name": "fail", "count": 2, "percentage": 33.3},
                                ],
                            },
                        },
                    }
                },
                {
                    "node": {
                        "acronym": "DEF",
                        "domainCount": 12,
                        "summaries": {
                            "web": {
                                "total": 12,
                                "categories": [
                                    {"name": "pass", "count": 1, "percentage": 8.3},
                                    {"name": "fail", "count": 11, "percentage": 91.7},
                                ],
                            },
                            "mail": {
                                "total": 12,
                                "categories": [
                                    {"name": "pass", "count": 7, "percentage": 58.3},
                                    {"name": "fail", "count": 5, "percentage": 41.7},
                                ],
                            },
                        },
                    }
                },
            ]
        }
    }


@pytest.fixture
def name_summary_input():
    return {
        "findOrganizationBySlug": {
            "acronym": "DEF",
            "domainCount": 12,
            "summaries": {
                "web": {
                    "total": 12,
                    "categories": [
                        {"name": "pass", "count": 1, "percentage": 8.3},
                        {"name": "fail", "count": 11, "percentage": 91.7},
                    ],
                },
                "mail": {
                    "total": 12,
                    "categories": [
                        {"name": "pass", "count": 7, "percentage": 58.3},
                        {"name": "fail", "count": 5, "percentage": 41.7},
                    ],
                },
            },
        }
    }