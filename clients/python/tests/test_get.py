import json

import pytest
import pytest_mock

from gql import Client

# Avoid confusion with gql Client
import tracker_client.client as tc
import tracker_client.queries as queries


def test_get_all_domains_error(mocker):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value={
        "error": {"message": "No organization with the provided slug could be found."}
    })
    client = Client()
    result = tc.get_all_domains(client)
    assert result  == json.dumps({
        "error": {"message": "No organization with the provided slug could be found."}
    }, indent=4)


def test_get_all_domains(mocker, all_domains_input, all_domains_output):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=all_domains_input)

    client = Client()
    result = tc.get_all_domains(client)
    tc.execute_query.assert_called_once_with(client, queries.ALL_DOMAINS_QUERY)
    assert result == json.dumps(all_domains_output, indent=4)


def test_get_domains_by_acronym_error(mocker):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value={
        "error": {"message": "No organization with the provided slug could be found."}
    })
    client = Client()
    result = tc.get_domains_by_acronym(client, "foo")
    assert result  == json.dumps({
        "error": {"message": "No organization with the provided slug could be found."}
    }, indent=4)


def test_get_domains_by_acronym_key_error(mocker, all_domains_input):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=all_domains_input)

    client = Client()
    result = tc.get_domains_by_acronym(client, "foo")
    tc.execute_query.assert_called_once_with(client, queries.ALL_DOMAINS_QUERY)
    assert result == json.dumps({
        "error": {"message": "No organization with the provided acronym could be found."}
    }, indent=4)


def test_get_domains_by_acronym(mocker, all_domains_input, org_domains_output):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=all_domains_input)

    client = Client()
    result = tc.get_domains_by_acronym(client, "def")
    tc.execute_query.assert_called_once_with(client, queries.ALL_DOMAINS_QUERY)
    assert result == json.dumps(org_domains_output, indent=4)


def test_get_domains_by_name_error(mocker):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value={
        "error": {"message": "No organization with the provided slug could be found."}
    })
    client = Client()
    result = tc.get_domains_by_name(client, "foo-bar")
    assert result  == json.dumps({
        "error": {"message": "No organization with the provided slug could be found."}
    }, indent=4)


def test_get_domains_by_name(mocker, name_domain_input, org_domains_output):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=name_domain_input)
    expected_params = {"orgSlug": "foo-bar"}

    client = Client()
    result = tc.get_domains_by_name(client, "foo bar")
    tc.execute_query.assert_called_once_with(client, queries.DOMAINS_BY_SLUG, expected_params)
    assert result == json.dumps(org_domains_output, indent=4)


def test_get_dmarc_summary_error(mocker):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value={
        "error": {"message": "No organization with the provided slug could be found."}
    })
    client = Client()
    result = tc.get_dmarc_summary(client, "foo.bar", "september", "2020")
    assert result  == json.dumps({
        "error": {"message": "No organization with the provided slug could be found."}
    }, indent=4)


def test_get_dmarc_summary(mocker, monthly_dmarc_input, monthly_dmarc_output):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=monthly_dmarc_input)
    expected_params = {"domain": "foo.bar", "month": "SEPTEMBER", "year": "2020"}

    client = Client()
    result = tc.get_dmarc_summary(client, "foo.bar", "september", "2020")
    tc.execute_query.assert_called_once_with(client, queries.DMARC_SUMMARY, expected_params)
    assert result == json.dumps(monthly_dmarc_output, indent=4)


def test_get_yearly_dmarc_summaries_error(mocker):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value={
        "error": {"message": "No organization with the provided slug could be found."}
    })
    client = Client()
    result = tc.get_yearly_dmarc_summaries(client, "foo.bar")
    assert result  == json.dumps({
        "error": {"message": "No organization with the provided slug could be found."}
    }, indent=4)


def test_get_yearly_dmarc_summaries(mocker, yearly_dmarc_input, yearly_dmarc_output):
    mocker.patch("tracker_client.client.execute_query", auto_spec=True, return_value=yearly_dmarc_input)
    expected_params = {"domain": "foo.bar"}

    client = Client()
    result = tc.get_yearly_dmarc_summaries(client, "foo.bar")
    tc.execute_query.assert_called_once_with(client, queries.DMARC_YEARLY_SUMMARIES, expected_params)
    assert result == json.dumps(yearly_dmarc_output, indent=4)