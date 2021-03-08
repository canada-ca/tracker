"""Tests for methods on the Organization class"""
import json

import pytest

import tracker_client.queries as queries


# pylint: disable=no-member
def test_org_get_summary(mock_org, org_summary_input, org_summary_output):
    """Test that Organization.get_summary produces correct output"""
    test_org = mock_org(org_summary_input)
    result = test_org.get_summary()

    test_org.client.execute_query.assert_called_once_with(
        queries.SUMMARY_BY_SLUG, {"orgSlug": "foo"}
    )
    assert result == json.dumps(org_summary_output, indent=4)


def test_org_get_summary_error(mock_org, error_message):
    """Test that Organization.get_summary correctly handles error response"""
    test_org = mock_org(error_message)
    assert test_org.get_summary() == json.dumps(error_message, indent=4)


def test_org_get_domains(mock_org, org_get_domains_input):
    """Test that Organization.get_domains produces correct output"""
    test_org = mock_org(org_get_domains_input)
    domain_list = test_org.get_domains()

    test_org.client.execute_query.assert_called_once_with(
        queries.GET_ORG_DOMAINS, {"orgSlug": "foo", "after": "abc"}
    )
    assert domain_list[0].domain_name == "foo.bar"
    assert domain_list[1].dmarc_phase == "not implemented"
    assert domain_list[2].last_ran == "2021-01-27 23:24:26.911236"
    assert domain_list[0].dkim_selectors == []


def test_org_get_domains_pagination(
    mock_org, org_get_domains_input, org_get_domains_has_next_input
):
    """Test that Organization.get_domains correctly requests more domains if hasNextPage is true"""

    def mock_return(query, params):
        if params["after"] == "abc":
            return org_get_domains_input
        return org_get_domains_has_next_input

    test_org = mock_org(None)
    test_org.client.execute_query = mock_return
    domain_list = test_org.get_domains()

    # If get_domains didn't try to paginate, len(domain_list) will be 3.
    # If it didn't stop trying to get more domains after hasNextPage became false
    # then the length will be greater than 6.
    assert len(domain_list) == 6


def test_org_get_domains_error(mock_org, error_message, capsys):
    """Test that Organization.get_domains correctly handles error response"""
    test_org = mock_org(error_message)

    with pytest.raises(ValueError, match=r"Unable to get domains for foo"):
        test_org.get_domains()

    captured = capsys.readouterr()
    assert "Server error:" in captured.out
