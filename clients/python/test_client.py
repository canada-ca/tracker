import pytest
from src.tracker_client import *


@pytest.fixture
def domain_input_dict():
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
def name_domains_input_dict():
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


def test_format_acronym_domains(domain_input_dict):
    expected_output = {
        "domains": ["qwe-rty.com", "foo.bar.baz", "fizz-buzz.bang", "xyz-abc-mn.net"]
    }
    assert format_acronym_domains("def", domain_input_dict) == expected_output


def test_format_all_domains(domain_input_dict):
    expected_output = {
        "ABC": {"domains": ["abc.def.ca", "test-test.cd.ca"]},
        "DEF": {
            "domains": [
                "qwe-rty.com",
                "foo.bar.baz",
                "fizz-buzz.bang",
                "xyz-abc-mn.net",
            ]
        },
        "GHI": {"domains": ["abcdef.xyz"]},
    }
    assert format_all_domains(domain_input_dict) == expected_output


def test_format_name_domains(name_domains_input_dict):
    expected_output = {
        "domains": ["qwe-rty.com", "foo.bar.baz", "fizz-buzz.bang", "xyz-abc-mn.net"]
    }
    assert format_name_domains(name_domains_input_dict) == expected_output


def test_format_dmarc_monthly(monthly_dmarc_input):
    expected_output = {
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
    assert format_dmarc_monthly(monthly_dmarc_input) == expected_output


def test_format_dmarc_yearly(yearly_dmarc_input):
    expected_output = {
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
    assert format_dmarc_yearly(yearly_dmarc_input) == expected_output
