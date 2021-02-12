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