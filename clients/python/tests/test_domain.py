"""Tests for methods on the Domain class"""
import json

import pytest

from tracker_client.domain import Domain
import tracker_client.queries as queries


# pylint: disable=no-member
def test_domain_get_status(
    mocker, mock_domain, domain_status_input, domain_status_output
):
    """Test that Domain.get_status produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=domain_status_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_status()
    client.execute_query.assert_called_once_with(
        queries.DOMAIN_STATUS, {"domain": "foo.bar"}
    )
    assert result == json.dumps(domain_status_output, indent=4)


def test_domain_get_status_error(mocker, mock_domain, error_message):
    """Test that Domain.get_status correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_status() == json.dumps(error_message, indent=4)


def test_domain_get_monthly_dmarc_summary(
    mocker, mock_domain, monthly_dmarc_input, monthly_dmarc_output
):
    """Test that Domain.get_monthly_dmarc_summary produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=monthly_dmarc_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_monthly_dmarc_summary("september", 2020)
    client.execute_query.assert_called_once_with(
        queries.DMARC_SUMMARY,
        {"domain": "foo.bar", "month": "SEPTEMBER", "year": "2020"},
    )
    assert result == json.dumps(monthly_dmarc_output, indent=4)


def test_domain_get_monthly_dmarc_summary_error(mocker, mock_domain, error_message):
    """Test that Domain.get_monthly_dmarc_summary correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_monthly_dmarc_summary("september", 2020) == json.dumps(
        error_message, indent=4
    )


def test_domain_get_yearly_dmarc_summaries(
    mocker, mock_domain, yearly_dmarc_input, yearly_dmarc_output
):
    """Test that Domain.get_yearly_dmarc_summaries produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=yearly_dmarc_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_yearly_dmarc_summaries()
    client.execute_query.assert_called_once_with(
        queries.DMARC_YEARLY_SUMMARIES, {"domain": "foo.bar"}
    )
    assert result == json.dumps(yearly_dmarc_output, indent=4)


def test_domain_get_yearly_dmarc_summaries_error(mocker, mock_domain, error_message):
    """Test that Domain.get_yearly_dmarc_summaries correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_yearly_dmarc_summaries() == json.dumps(
        error_message, indent=4
    )


def test_domain_get_all_results(
    mocker, mock_domain, all_results_input, all_results_output
):
    """Test that Domain.get_all_results produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=all_results_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_all_results()
    client.execute_query.assert_called_once_with(
        queries.ALL_RESULTS, {"domain": "foo.bar"}
    )
    assert result == json.dumps(all_results_output, indent=4)


def test_domain_get_all_results_error(mocker, mock_domain, error_message):
    """Test that Domain.get_all_results correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_all_results() == json.dumps(error_message, indent=4)


def test_domain_get_web_results(
    mocker, mock_domain, web_results_input, web_results_output
):
    """Test that Domain.get_web_results produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=web_results_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_web_results()
    client.execute_query.assert_called_once_with(
        queries.WEB_RESULTS, {"domain": "foo.bar"}
    )
    assert result == json.dumps(web_results_output, indent=4)


def test_domain_get_web_results_error(mocker, mock_domain, error_message):
    """Test that Domain.get_web_results correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_web_results() == json.dumps(error_message, indent=4)


def test_domain_get_email_results(
    mocker, mock_domain, email_results_input, email_results_output
):
    """Test that Domain.get_email_results produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=email_results_input)
    test_domain = Domain(client, **mock_domain)

    result = test_domain.get_email_results()
    client.execute_query.assert_called_once_with(
        queries.EMAIL_RESULTS, {"domain": "foo.bar"}
    )
    assert result == json.dumps(email_results_output, indent=4)


def test_domain_get_email_results_error(mocker, mock_domain, error_message):
    """Test that Domain.get_email_results correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)
    test_domain = Domain(client, **mock_domain)

    assert test_domain.get_email_results() == json.dumps(error_message, indent=4)


def test_domain_get_owners(mocker, mock_domain, domain_get_owners_input):
    """Test that Domain.get_owners produces correct output"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=domain_get_owners_input)

    test_domain = Domain(client, **mock_domain)
    org_list = test_domain.get_owners()

    client.execute_query.assert_called_once_with(
        queries.GET_DOMAIN_OWNERS, {"domain": "foo.bar"}
    )
    assert org_list[0].acronym == "FOO"
    assert org_list[1].name == "Fizz Bang"
    assert org_list[0].domain_count == 10
    assert org_list[1].verified


def test_domain_get_owners_error(mocker, mock_domain, error_message, capsys):
    """Test that Domain.get_owners correctly handles error response"""
    client = mocker.MagicMock(spec="tracker_client.client.Client")
    client.execute_query = mocker.MagicMock(return_value=error_message)

    test_domain = Domain(client, **mock_domain)

    with pytest.raises(ValueError, match=r"Unable to get owners for foo.bar"):
        test_domain.get_owners()

    captured = capsys.readouterr()
    assert "Server error:" in captured.out
