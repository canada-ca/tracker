import json

from gql import Client

# Avoid confusion with gql Client
import tracker_client.client as tc
import tracker_client.queries as queries


def test_get_dmarc_summary_error(mocker):
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value={
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
    )
    client = Client()
    result = tc.get_dmarc_summary(client, "foo.bar", "september", "2020")
    assert result == json.dumps(
        {
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
        indent=4,
    )


def test_get_dmarc_summary(mocker, monthly_dmarc_input, monthly_dmarc_output):
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=monthly_dmarc_input,
    )
    expected_params = {"domain": "foo.bar", "month": "SEPTEMBER", "year": "2020"}
    client = Client()
    result = tc.get_dmarc_summary(client, "foo.bar", "september", "2020")
    tc.execute_query.assert_called_once_with(
        client, queries.DMARC_SUMMARY, expected_params
    )
    assert result == json.dumps(monthly_dmarc_output, indent=4)


def test_get_yearly_dmarc_summaries_error(mocker):
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value={
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
    )
    client = Client()
    result = tc.get_yearly_dmarc_summaries(client, "foo.bar")
    assert result == json.dumps(
        {
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
        indent=4,
    )


def test_get_yearly_dmarc_summaries(mocker, yearly_dmarc_input, yearly_dmarc_output):
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=yearly_dmarc_input,
    )
    expected_params = {"domain": "foo.bar"}
    client = Client()
    result = tc.get_yearly_dmarc_summaries(client, "foo.bar")
    tc.execute_query.assert_called_once_with(
        client, queries.DMARC_YEARLY_SUMMARIES, expected_params
    )
    assert result == json.dumps(yearly_dmarc_output, indent=4)
