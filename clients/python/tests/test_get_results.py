import json

from gql import Client

# Avoid confusion with gql Client
import tracker_client.client as tc
import tracker_client.queries as queries


def test_get_domain_results_error(mocker):
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
    result = tc.get_domain_results(client, "foo.bar")
    assert result == json.dumps(
        {
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
        indent=4,
    )


def test_get_domain_results(mocker, scan_results_input, scan_results_output):
    mocker.patch(
        "tracker_client.client.execute_query",
        auto_spec=True,
        return_value=scan_results_input,
    )
    expected_params = {"domain": "foo.bar"}

    client = Client()
    result = tc.get_domain_results(client, "foo.bar")
    tc.execute_query.assert_called_once_with(
        client, queries.DOMAIN_RESULTS, expected_params
    )
    assert result == json.dumps(scan_results_output, indent=4)


def test_get_domain_status_error(mocker):
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
    result = tc.get_domain_status(client, "foo.bar")
    assert result == json.dumps(
        {
            "error": {
                "message": "No organization with the provided slug could be found."
            }
        },
        indent=4,
    )


def test_get_domain_status(mocker, domain_status_input, domain_status_output):
    mocker.patch(
        "tracker_client.client.execute_query",
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
