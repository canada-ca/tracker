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


def test_format_acronym_domains(domain_input_dict):
    expected_output = {"domains": ["qwe-rty.com", "foo.bar.baz", "fizz-buzz.bang", "xyz-abc-mn.net"]}
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
    expected_output = {"domains": ["qwe-rty.com", "foo.bar.baz", "fizz-buzz.bang", "xyz-abc-mn.net"]}
    assert format_name_domains(name_domains_input_dict) == expected_output