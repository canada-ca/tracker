import pytest


# Register "online" mark
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "online: mark test that tries to connect to Tracker"
    )


@pytest.fixture
def error_message():
    return {
        "error": {"message": "No organization with the provided slug could be found."}
    }


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
def all_domains_output():
    return {
        "ABC": ["abc.def.ca", "test-test.cd.ca"],
        "DEF": [
            "qwe-rty.com",
            "foo.bar.baz",
            "fizz-buzz.bang",
            "xyz-abc-mn.net",
        ],
        "GHI": ["abcdef.xyz"],
    }


@pytest.fixture
def name_domain_input():
    return {
        "findOrganizationBySlug": {
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
    }


@pytest.fixture
def org_domains_output():
    return {"DEF": ["qwe-rty.com", "foo.bar.baz", "fizz-buzz.bang", "xyz-abc-mn.net"]}


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
def monthly_dmarc_output():
    return {
        "abc-def.ghi": {
            "month": "NOVEMBER",
            "year": "2020",
            "categoryPercentages": {
                "fullPassPercentage": 86.76,
                "passSpfOnlyPercentage": 0.03,
                "passDkimOnlyPercentage": 5.59,
                "failPercentage": 7.62,
                "totalMessages": 12663,
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
def yearly_dmarc_output():
    return {
        "abc-def.ghi": [
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
        ]
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
def all_summaries_output():
    return {
        "ABC": {
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
        },
        "DEF": {
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
        },
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


@pytest.fixture
def org_summary_output():
    return {
        "DEF": {
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


@pytest.fixture
def all_results_input():
    null = None
    return {
        "findDomainByDomain": {
            "domain": "abcdef.gh.ij",
            "lastRan": "2021-01-27 23:24:26.911236",
            "web": {
                "https": {
                    "edges": [
                        {
                            "node": {
                                "implementation": "Valid HTTPS",
                                "enforced": "Strict",
                                "hsts": "HSTS Fully Implemented",
                                "hstsAge": "31536000",
                                "preloaded": "HSTS Preload Ready",
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                            }
                        }
                    ]
                },
                "ssl": {
                    "edges": [
                        {
                            "node": {
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                            }
                        }
                    ]
                },
            },
            "email": {
                "dkim": {"edges": [{"node": {"results": {"edges": []}}}]},
                "dmarc": {
                    "edges": [
                        {
                            "node": {
                                "dmarcPhase": null,
                                "record": "v=DMARC1; p=None; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
                                "pPolicy": "None",
                                "spPolicy": "None",
                                "pct": 100,
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc7",
                                                "tagName": "PCT-100",
                                                "guidance": "Policy applies to all of maniflow",
                                                "refLinks": [
                                                    {
                                                        "description": "B.3.1 DMARC Records",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, PCT",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc10",
                                                "tagName": "RUA-CCCS",
                                                "guidance": "CCCS added to Aggregate sender list",
                                                "refLinks": [
                                                    {
                                                        "description": "B.3.1 DMARC Records",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc11",
                                                "tagName": "RUF-CCCS",
                                                "guidance": "CCCS added to Forensic sender list",
                                                "refLinks": [
                                                    {
                                                        "description": "Missing from guide",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc14",
                                                "tagName": "TXT-DMARC-enabled",
                                                "guidance": "Verification TXT records for all 3rd party senders exist",
                                                "refLinks": [
                                                    {
                                                        "description": "TBD",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc17",
                                                "tagName": "SP-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, SP",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc23",
                                                "tagName": "DMARC-valid",
                                                "guidance": "DMARC record is properly formed",
                                                "refLinks": [
                                                    {
                                                        "description": "Implementation Guidance: Email Domain Protection",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                            }
                        }
                    ]
                },
                "spf": {
                    "edges": [
                        {
                            "node": {
                                "lookups": 4,
                                "record": "v=spf1 mx a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
                                "spfDefault": "-all",
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "spf12",
                                                "tagName": "SPF-valid",
                                                "guidance": "SPF record is properly formed",
                                                "refLinks": [
                                                    {
                                                        "description": "Implementation Guidance: Email Domain Protection",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                            }
                        }
                    ]
                },
            },
        }
    }


@pytest.fixture
def all_results_output():
    null = None
    return {
        "abcdef.gh.ij": {
            "lastRan": "2021-01-27 23:24:26.911236",
            "web": {
                "https": {
                    "implementation": "Valid HTTPS",
                    "enforced": "Strict",
                    "hsts": "HSTS Fully Implemented",
                    "hstsAge": "31536000",
                    "preloaded": "HSTS Preload Ready",
                    "positiveGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                    "neutralGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                    "negativeGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                },
                "ssl": {
                    "positiveGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                    "neutralGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                    "negativeGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                },
            },
            "email": {
                "dkim": {"results": {"edges": []}},
                "dmarc": {
                    "dmarcPhase": null,
                    "record": "v=DMARC1; p=None; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
                    "pPolicy": "None",
                    "spPolicy": "None",
                    "pct": 100,
                    "positiveGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc7": {
                            "tagName": "PCT-100",
                            "guidance": "Policy applies to all of maniflow",
                            "refLinks": [
                                {"description": "B.3.1 DMARC Records", "refLink": null}
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, PCT",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc10": {
                            "tagName": "RUA-CCCS",
                            "guidance": "CCCS added to Aggregate sender list",
                            "refLinks": [
                                {"description": "B.3.1 DMARC Records", "refLink": null}
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc11": {
                            "tagName": "RUF-CCCS",
                            "guidance": "CCCS added to Forensic sender list",
                            "refLinks": [
                                {"description": "Missing from guide", "refLink": null}
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc14": {
                            "tagName": "TXT-DMARC-enabled",
                            "guidance": "Verification TXT records for all 3rd party senders exist",
                            "refLinks": [{"description": "TBD", "refLink": null}],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc17": {
                            "tagName": "SP-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, SP",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc23": {
                            "tagName": "DMARC-valid",
                            "guidance": "DMARC record is properly formed",
                            "refLinks": [
                                {
                                    "description": "Implementation Guidance: Email Domain Protection",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "neutralGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                    },
                    "negativeGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                    },
                },
                "spf": {
                    "lookups": 4,
                    "record": "v=spf1 mx a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
                    "spfDefault": "-all",
                    "positiveGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "spf12": {
                            "tagName": "SPF-valid",
                            "guidance": "SPF record is properly formed",
                            "refLinks": [
                                {
                                    "description": "Implementation Guidance: Email Domain Protection",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "neutralGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "negativeGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                },
            },
        }
    }


@pytest.fixture
def web_results_input():
    null = None
    return {
        "findDomainByDomain": {
            "domain": "abcdef.gh.ij",
            "lastRan": "2021-01-27 23:24:26.911236",
            "web": {
                "https": {
                    "edges": [
                        {
                            "node": {
                                "implementation": "Valid HTTPS",
                                "enforced": "Strict",
                                "hsts": "HSTS Fully Implemented",
                                "hstsAge": "31536000",
                                "preloaded": "HSTS Preload Ready",
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "https11",
                                                "tagName": "HSTS-preload-ready",
                                                "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.2 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                            }
                        }
                    ]
                },
                "ssl": {
                    "edges": [
                        {
                            "node": {
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "ssl6",
                                                "tagName": "SSL-invalid-cipher",
                                                "guidance": "One or more ciphers in use are not compliant with guidelines",
                                                "refLinks": [
                                                    {
                                                        "description": "6.1.3/6.1.4/6.1.5 Direction",
                                                        "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "See ITSP.40.062 for approved cipher list",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                },
                            }
                        }
                    ]
                },
            },
        }
    }


@pytest.fixture
def web_results_output():
    null = None
    return {
        "abcdef.gh.ij": {
            "lastRan": "2021-01-27 23:24:26.911236",
            "web": {
                "https": {
                    "implementation": "Valid HTTPS",
                    "enforced": "Strict",
                    "hsts": "HSTS Fully Implemented",
                    "hstsAge": "31536000",
                    "preloaded": "HSTS Preload Ready",
                    "positiveGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                    "neutralGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                    "negativeGuidanceTags": {
                        "https11": {
                            "tagName": "HSTS-preload-ready",
                            "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
                            "refLinks": [
                                {
                                    "description": "6.1.2 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        }
                    },
                },
                "ssl": {
                    "positiveGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                    "neutralGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                    "negativeGuidanceTags": {
                        "ssl6": {
                            "tagName": "SSL-invalid-cipher",
                            "guidance": "One or more ciphers in use are not compliant with guidelines",
                            "refLinks": [
                                {
                                    "description": "6.1.3/6.1.4/6.1.5 Direction",
                                    "refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "See ITSP.40.062 for approved cipher list",
                                    "refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
                                }
                            ],
                        }
                    },
                },
            },
        }
    }


@pytest.fixture
def email_results_input():
    null = None
    return {
        "findDomainByDomain": {
            "domain": "abcdef.gh.ij",
            "lastRan": "2021-01-27 23:24:26.911236",
            "email": {
                "dkim": {"edges": [{"node": {"results": {"edges": []}}}]},
                "dmarc": {
                    "edges": [
                        {
                            "node": {
                                "dmarcPhase": null,
                                "record": "v=DMARC1; p=None; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
                                "pPolicy": "None",
                                "spPolicy": "None",
                                "pct": 100,
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc7",
                                                "tagName": "PCT-100",
                                                "guidance": "Policy applies to all of maniflow",
                                                "refLinks": [
                                                    {
                                                        "description": "B.3.1 DMARC Records",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, PCT",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc10",
                                                "tagName": "RUA-CCCS",
                                                "guidance": "CCCS added to Aggregate sender list",
                                                "refLinks": [
                                                    {
                                                        "description": "B.3.1 DMARC Records",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc11",
                                                "tagName": "RUF-CCCS",
                                                "guidance": "CCCS added to Forensic sender list",
                                                "refLinks": [
                                                    {
                                                        "description": "Missing from guide",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc14",
                                                "tagName": "TXT-DMARC-enabled",
                                                "guidance": "Verification TXT records for all 3rd party senders exist",
                                                "refLinks": [
                                                    {
                                                        "description": "TBD",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc17",
                                                "tagName": "SP-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, SP",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "dmarc23",
                                                "tagName": "DMARC-valid",
                                                "guidance": "DMARC record is properly formed",
                                                "refLinks": [
                                                    {
                                                        "description": "Implementation Guidance: Email Domain Protection",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "dmarc4",
                                                "tagName": "P-none",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": "RFC 6.3 General Record Format, P",
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                            }
                        }
                    ]
                },
                "spf": {
                    "edges": [
                        {
                            "node": {
                                "lookups": 4,
                                "record": "v=spf1 mx a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
                                "spfDefault": "-all",
                                "positiveGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                        {
                                            "node": {
                                                "tagId": "spf12",
                                                "tagName": "SPF-valid",
                                                "guidance": "SPF record is properly formed",
                                                "refLinks": [
                                                    {
                                                        "description": "Implementation Guidance: Email Domain Protection",
                                                        "refLink": null,
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "neutralGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                                "negativeGuidanceTags": {
                                    "edges": [
                                        {
                                            "node": {
                                                "tagId": "spf8",
                                                "tagName": "ALL-hardfail",
                                                "guidance": "Follow implementation guide",
                                                "refLinks": [
                                                    {
                                                        "description": "B.1.1 SPF Records",
                                                        "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                                    }
                                                ],
                                                "refLinksTech": [
                                                    {
                                                        "description": null,
                                                        "refLink": null,
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                },
                            }
                        }
                    ]
                },
            },
        }
    }


@pytest.fixture
def email_results_output():
    null = None
    return {
        "abcdef.gh.ij": {
            "lastRan": "2021-01-27 23:24:26.911236",
            "email": {
                "dkim": {"results": {"edges": []}},
                "dmarc": {
                    "dmarcPhase": null,
                    "record": "v=DMARC1; p=None; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1",
                    "pPolicy": "None",
                    "spPolicy": "None",
                    "pct": 100,
                    "positiveGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc7": {
                            "tagName": "PCT-100",
                            "guidance": "Policy applies to all of maniflow",
                            "refLinks": [
                                {"description": "B.3.1 DMARC Records", "refLink": null}
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, PCT",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc10": {
                            "tagName": "RUA-CCCS",
                            "guidance": "CCCS added to Aggregate sender list",
                            "refLinks": [
                                {"description": "B.3.1 DMARC Records", "refLink": null}
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc11": {
                            "tagName": "RUF-CCCS",
                            "guidance": "CCCS added to Forensic sender list",
                            "refLinks": [
                                {"description": "Missing from guide", "refLink": null}
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc14": {
                            "tagName": "TXT-DMARC-enabled",
                            "guidance": "Verification TXT records for all 3rd party senders exist",
                            "refLinks": [{"description": "TBD", "refLink": null}],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "dmarc17": {
                            "tagName": "SP-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, SP",
                                    "refLink": null,
                                }
                            ],
                        },
                        "dmarc23": {
                            "tagName": "DMARC-valid",
                            "guidance": "DMARC record is properly formed",
                            "refLinks": [
                                {
                                    "description": "Implementation Guidance: Email Domain Protection",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "neutralGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                    },
                    "negativeGuidanceTags": {
                        "dmarc4": {
                            "tagName": "P-none",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [
                                {
                                    "description": "RFC 6.3 General Record Format, P",
                                    "refLink": null,
                                }
                            ],
                        },
                    },
                },
                "spf": {
                    "lookups": 4,
                    "record": "v=spf1 mx a:edge.cyber.gc.ca include:spf.protection.outlook.com -all",
                    "spfDefault": "-all",
                    "positiveGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                        "spf12": {
                            "tagName": "SPF-valid",
                            "guidance": "SPF record is properly formed",
                            "refLinks": [
                                {
                                    "description": "Implementation Guidance: Email Domain Protection",
                                    "refLink": null,
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "neutralGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                    "negativeGuidanceTags": {
                        "spf8": {
                            "tagName": "ALL-hardfail",
                            "guidance": "Follow implementation guide",
                            "refLinks": [
                                {
                                    "description": "B.1.1 SPF Records",
                                    "refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
                                }
                            ],
                            "refLinksTech": [{"description": null, "refLink": null}],
                        },
                    },
                },
            },
        }
    }


@pytest.fixture
def domain_status_input():
    return {
        "findDomainByDomain": {
            "domain": "abcdef.gh.ij",
            "lastRan": "2021-01-27 23:24:26.911236",
            "status": {
                "https": "FAIL",
                "ssl": "FAIL",
                "dmarc": "PASS",
                "dkim": "PASS",
                "spf": "PASS",
            },
        }
    }


@pytest.fixture
def domain_status_output():
    return {
        "abcdef.gh.ij": {
            "lastRan": "2021-01-27 23:24:26.911236",
            "status": {
                "https": "FAIL",
                "ssl": "FAIL",
                "dmarc": "PASS",
                "dkim": "PASS",
                "spf": "PASS",
            },
        }
    }
