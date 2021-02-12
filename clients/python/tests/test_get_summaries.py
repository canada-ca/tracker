import json

from gql import Client

# Avoid confusion with gql Client
import tracker_client.client as tc
import tracker_client.queries as queries

# pylint: disable=no-member


def test_get_all_summaries_error(mocker, error_message):
    """Test that get_all_summaries correctly handles an error response"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_all_summaries(client)

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_all_summaries(mocker, all_summaries_input, all_summaries_output):
    """Test that get_all_summaries produces correct output"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=all_summaries_input,
    )

    client = Client()
    result = tc.get_all_summaries(client)

    tc.execute_query.assert_called_once_with(client, queries.ALL_ORG_SUMMARIES)
    assert result == json.dumps(all_summaries_output, indent=4)


def test_get_summary_by_acronym_error(mocker, error_message):
    """Test that get_summary_by_acronym correctly handles an error response"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_summary_by_acronym(client, "foo")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_summary_by_acronym_key_error(mocker, all_summaries_input):
    """Test that get_summary_by_acronym correctly handles the given acronym not being in the response"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=all_summaries_input,
    )

    client = Client()
    result = tc.get_summary_by_acronym(client, "foo")

    tc.execute_query.assert_called_once_with(client, queries.ALL_ORG_SUMMARIES)
    assert result == json.dumps(
        {
            "error": {
                "message": "No organization with the provided acronym could be found."
            }
        },
        indent=4,
    )


def test_get_summary_by_acronym(mocker, all_summaries_input, org_summary_output):
    """Test that get_summary_by_acronym produces correct output"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=all_summaries_input,
    )

    client = Client()
    result = tc.get_summary_by_acronym(client, "def")

    tc.execute_query.assert_called_once_with(client, queries.ALL_ORG_SUMMARIES)
    assert result == json.dumps(org_summary_output, indent=4)


def test_get_summary_by_name_error(mocker, error_message):
    """Test that get_summary_by_name correctly handles an error response"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=error_message,
    )

    client = Client()
    result = tc.get_domains_by_name(client, "foo bar")

    assert result == json.dumps(
        error_message,
        indent=4,
    )


def test_get_summary_by_name(mocker, name_summary_input, org_summary_output):
    """Test that get_summary_by_acronym produces correct output"""
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=name_summary_input,
    )

    expected_params = {"orgSlug": "foo-bar"}
    client = Client()
    result = tc.get_summary_by_name(client, "foo bar")

    tc.execute_query.assert_called_once_with(
        client, queries.SUMMARY_BY_SLUG, expected_params
    )
    assert result == json.dumps(org_summary_output, indent=4)
