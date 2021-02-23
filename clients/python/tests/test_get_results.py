"""Tests for functions that get scan results for a domain"""
import json

from gql import Client

# Avoid confusion with gql Client
import tracker_client.results as tc
import tracker_client.queries as queries

# pylint: disable=no-member


def test_get_all_results_error(mocker, error_message):
    """Test that get_all_results correctly handles error response"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_all_results(client, "foo.bar")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_all_results(mocker, all_results_input, all_results_output):
    """Test that get_all_results produces correct output"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=all_results_input,
    )

    expected_params = {"domain": "foo.bar"}
    client = Client()
    result = tc.get_all_results(client, "foo.bar")

    tc.execute_query.assert_called_once_with(
        client, queries.ALL_RESULTS, expected_params
    )
    assert result == json.dumps(all_results_output, indent=4)


def test_get_web_results_error(mocker, error_message):
    """Test that get_web_results correctly handles error response"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_web_results(client, "foo.bar")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_web_results(mocker, web_results_input, web_results_output):
    """Test that get_web_results produces correct output"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=web_results_input,
    )

    expected_params = {"domain": "foo.bar"}
    client = Client()
    result = tc.get_web_results(client, "foo.bar")

    tc.execute_query.assert_called_once_with(
        client, queries.WEB_RESULTS, expected_params
    )
    assert result == json.dumps(web_results_output, indent=4)


def test_get_email_results_error(mocker, error_message):
    """Test that get_email_results correctly handles error response"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_email_results(client, "foo.bar")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_email_results(mocker, email_results_input, email_results_output):
    """Test that get_email_results produces correct output"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=email_results_input,
    )

    expected_params = {"domain": "foo.bar"}
    client = Client()
    result = tc.get_email_results(client, "foo.bar")

    tc.execute_query.assert_called_once_with(
        client, queries.EMAIL_RESULTS, expected_params
    )
    assert result == json.dumps(email_results_output, indent=4)


def test_get_domain_status_error(mocker, error_message):
    """Test that get_domain_status correctly handles error response"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_domain_status(client, "foo.bar")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_domain_status(mocker, domain_status_input, domain_status_output):
    """Test that get_domain_status produces correct output"""
    mocker.patch(
        "tracker_client.results.execute_query",
        auto_spec=True,
        return_value=domain_status_input,
    )

    expected_params = {"domain": "foo.bar"}
    client = Client()
    result = tc.get_domain_status(client, "foo.bar")

    tc.execute_query.assert_called_once_with(
        client, queries.DOMAIN_STATUS, expected_params
    )
    assert result == json.dumps(domain_status_output, indent=4)
